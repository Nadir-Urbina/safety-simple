"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  where 
} from "firebase/firestore"
import { 
  createUserWithEmailAndPassword, 
  updatePassword, 
  sendPasswordResetEmail,
  getAuth,
  EmailAuthProvider,
  signInWithCredential
} from "firebase/auth"
import { db } from "@/lib/firebase"
import * as XLSX from 'xlsx'
import { toDate } from '@/lib/firebase-utils'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  User,
  UserPlus,
  Edit,
  Trash2,
  MoreHorizontal,
  Lock,
  Mail,
  Phone,
  Search,
  UserCog,
  Shield,
  Upload,
  FileText,
  HelpCircle,
  AlertOctagon,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw
} from "lucide-react"

interface TeamMember {
  id: string;
  uid?: string;
  userDocId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  status: string;
}

interface OrganizationSubscription {
  tier: string
  seats: number
  expiresAt: Date
}

export default function TeamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { organization } = useOrganization()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isCsvUploadDialogOpen, setIsCsvUploadDialogOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [isCsvProcessing, setIsCsvProcessing] = useState(false)
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null)
  const [seatsAvailable, setSeatsAvailable] = useState(0)
  
  // Form states
  const [newMemberData, setNewMemberData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
    confirmPassword: "",
  })
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false)
  
  // New state for the info dialog
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  
  // Add the current user to members collection if they don't exist there
  const ensureCurrentUserInMembers = async () => {
    if (!user || !organization?.id) return;
    
    try {
      // Check if user exists in members collection
      const membersRef = collection(db, "organizations", organization.id, "members");
      const membersQuery = query(membersRef, where("uid", "==", user.uid));
      const membersSnapshot = await getDocs(membersQuery);
      
      // If user doesn't exist in members, add them
      if (membersSnapshot.empty) {
        console.log("Adding current user to members collection");
        
        // Add user to organization members
        await addDoc(collection(db, "organizations", organization.id, "members"), {
          uid: user.uid,
          role: user.role || "admin", // Default to admin if no role is set
          addedAt: new Date(),
        });
        
        toast.success("You have been added to the team members");
      }
    } catch (error) {
      console.error("Error ensuring current user in members:", error);
    }
  };
  
  // Load team members and subscription data
  useEffect(() => {
    const loadTeamMembersAndSubscription = async () => {
      if (!organization?.id) {
        console.log("No organization ID available");
        return;
      }
      
      console.log("Loading team members for organization:", organization.id);
      
      try {
        setIsLoading(true)
        
        // First ensure the current user is in the members collection
        await ensureCurrentUserInMembers();
        
        const membersRef = collection(db, "organizations", organization.id, "members");
        const membersSnapshot = await getDocs(membersRef);
        
        if (membersSnapshot.empty) {
          console.log("No members found in the collection");
          setTeamMembers([]);
          setFilteredMembers([]);
          setIsLoading(false);
          return;
        }

        const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          console.log("Member data found:", memberData);
          
          // Case 1: Pending users with userDocId
          if (memberData.status === "pending" && memberData.userDocId) {
            try {
              const pendingUserDoc = await getDoc(doc(db, "users", memberData.userDocId));
              if (pendingUserDoc.exists()) {
                const userData = pendingUserDoc.data();
                return {
                  id: memberDoc.id,
                  userDocId: memberData.userDocId,
                  firstName: userData.firstName || "",
                  lastName: userData.lastName || "",
                  email: userData.email || "",
                  phone: userData.phone || "",
                  role: memberData.role || "user",
                  status: "pending",
                  createdAt: toDate(memberData.addedAt),
                };
              }
            } catch (error) {
              console.error("Error fetching pending user:", error);
            }
          }
          
          // Case 2: Active users with uid
          if (memberData.uid) {
            try {
              const userDoc = await getDoc(doc(db, "users", memberData.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  id: memberDoc.id,
                  uid: memberData.uid,
                  firstName: userData.firstName || userData.displayName?.split(' ')[0] || "",
                  lastName: userData.lastName || userData.displayName?.split(' ').slice(1).join(' ') || "",
                  email: userData.email || "",
                  phone: userData.phone || "",
                  role: memberData.role || userData.role || "user",
                  status: memberData.status || "active",
                  createdAt: toDate(userData.createdAt),
                  updatedAt: toDate(userData.updatedAt),
                };
              }
            } catch (error) {
              console.error("Error fetching active user:", error);
            }
          }
          
          // Case 3: Fallback for any other case
          return {
            id: memberDoc.id,
            firstName: "Unknown",
            lastName: "User",
            email: memberData.email || "",
            phone: "",
            role: memberData.role || "user",
            status: memberData.status || "pending",
          };
        });
        
        let members = await Promise.all(memberPromises);
        
        // Filter out any undefined or null values
        members = members.filter(member => member);
        
        // Log the retrieved members for debugging
        console.log("Retrieved members:", members.length, "members");
        
        // Sort by role (admin first, then analyst, then user) and then by name
        const roleOrder: Record<string, number> = { admin: 0, analyst: 1, user: 2 };
        members.sort((a, b) => {
          const roleA = roleOrder[a.role as keyof typeof roleOrder] || 999;
          const roleB = roleOrder[b.role as keyof typeof roleOrder] || 999;
          
          if (roleA !== roleB) return roleA - roleB;
          
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        setTeamMembers(members);
        setFilteredMembers(members);
        
        // Debug logs to see all members
        console.log("All processed members:", JSON.stringify(members));
        
        // Load subscription data
        const subscriptionRef = doc(db, "organizations", organization.id, "subscription", "current")
        const subscriptionSnapshot = await getDoc(subscriptionRef)
        
        // First check the organization document directly for licenses
        const orgRef = doc(db, "organizations", organization.id);
        const orgDoc = await getDoc(orgRef);
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          console.log("Organization data:", orgData);
          
          // Check if we have a licenses field in the organization document
          if (orgData.licenses) {
            console.log("Found licenses in org data:", orgData.licenses);
            
            // Calculate total seats from all license types
            const adminTotal = orgData.licenses.admin?.total || 0;
            const analystTotal = orgData.licenses.analyst?.total || 0;
            const userTotal = orgData.licenses.user?.total || 0;
            const totalSeats = adminTotal + analystTotal + userTotal;
            
            // Set up subscription info
            setSubscription({
              tier: orgData.license?.plan || "basic",
              seats: totalSeats,
              expiresAt: orgData.license?.expiresAt ? toDate(orgData.license.expiresAt) || new Date() : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
            });
            
            setSeatsAvailable(Math.max(0, totalSeats - members.length));
            return;
          }
        }
        
        // Fall back to the subscription collection if no licenses in organization document
        if (subscriptionSnapshot.exists()) {
          const subscriptionData = subscriptionSnapshot.data() as OrganizationSubscription
          setSubscription(subscriptionData)
          
          // Calculate seats available
          const usedSeats = members.length
          const totalSeats = subscriptionData.seats || 0
          setSeatsAvailable(Math.max(0, totalSeats - usedSeats))
        } else {
          // For development, since we have a specific purchase of 5 "user" licenses
          setSubscription({
            tier: "basic",
            seats: 5, // Hard-coded to 5 seats as mentioned
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year from now
          })
          setSeatsAvailable(5 - members.length)
        }
      } catch (error) {
        console.error("Error loading team members:", error)
        toast.error("Failed to load team members")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (organization?.id) {
      loadTeamMembersAndSubscription()
    }
  }, [organization?.id])
  
  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(teamMembers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = teamMembers.filter(member => 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.phone.includes(query)
      )
      setFilteredMembers(filtered)
    }
    
    // Debug log filtered members
    console.log("Current filtered members:", filteredMembers);
  }, [searchQuery, teamMembers])
  
  // Handle CSV/XLSX file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setCsvFile(file)
      
      // Parse file based on extension
      const reader = new FileReader()
      
      reader.onload = (event) => {
        if (event.target) {
          const fileData = event.target.result
          
          try {
            // Check if file is Excel format
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
              // Parse as Excel
              const workbook = XLSX.read(fileData, { type: 'binary' })
              const firstSheetName = workbook.SheetNames[0]
              const worksheet = workbook.Sheets[firstSheetName]
              const data = XLSX.utils.sheet_to_json(worksheet)
              setCsvData(data)
            } else {
              // Parse as CSV
              const csvText = event.target.result as string
              const lines = csvText.split('\n')
              const headers = lines[0].split(',').map(header => header.trim())
              
              const data = []
              
              for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue
                
                const values = lines[i].split(',').map(value => value.trim())
                const row: any = {}
                
                headers.forEach((header, index) => {
                  row[header] = values[index] || ''
                })
                
                data.push(row)
              }
              
              setCsvData(data)
            }
          } catch (error) {
            console.error("Error parsing file:", error)
            toast.error("Failed to parse file. Make sure it's a valid CSV or Excel file.")
            setCsvData([])
          }
        }
      }
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsBinaryString(file)
      } else {
        reader.readAsText(file)
      }
    }
  }
  
  // Process CSV/XLSX data and add users
  const processImportedData = async () => {
    if (!organization?.id || csvData.length === 0) {
      toast.error("No data to process")
      return
    }
    
    // Check if we have enough seats
    if (seatsAvailable < csvData.length) {
      toast.error(`Not enough seats available. You need ${csvData.length} seats but only have ${seatsAvailable} available.`)
      return
    }
    
    // Validate data
    const invalidRows = csvData.filter(row => {
      return !row.firstName || !row.lastName || !row.email || !row.password
    })
    
    if (invalidRows.length > 0) {
      toast.error(`${invalidRows.length} row(s) have missing required fields`)
      return
    }
    
    try {
      setIsCsvProcessing(true)
      let successCount = 0
      let errorCount = 0
      const auth = getAuth()
      
      for (const row of csvData) {
        try {
          // Create the user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            row.email,
            row.password
          )
          
          const uid = userCredential.user.uid
          
          // Create user document
          await addDoc(collection(db, "users"), {
            uid,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone || "",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          
          // Add user to organization
          await addDoc(collection(db, "organizations", organization.id, "members"), {
            uid,
            role: row.role || "user",
            addedAt: new Date(),
          })
          
          successCount++
        } catch (error: any) {
          console.error("Error adding user from import:", error)
          errorCount++
          // Continue with next row
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} team member(s)`)
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} team member(s)`)
      }
      
      // Reset form and close dialog
      setCsvFile(null)
      setCsvData([])
      setIsCsvUploadDialogOpen(false)
      
      // Refresh team members list
      await refreshTeamMembers()
    } catch (error) {
      console.error("Error processing imported data:", error)
      toast.error("Failed to process file")
    } finally {
      setIsCsvProcessing(false)
    }
  }
  
  // Refresh team members
  const refreshTeamMembers = async () => {
    if (!organization?.id) return
    
    try {
      const membersRef = collection(db, "organizations", organization.id, "members")
      const membersQuery = query(membersRef)
      const membersSnapshot = await getDocs(membersQuery)
      
      const members: TeamMember[] = []
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data()
        
        // Handle both legacy (uid-based) and new (userDocId-based) members
        let userDoc;
        
        if (memberData.uid) {
          // Legacy path - try direct UID lookup
          userDoc = await getDoc(doc(db, "users", memberData.uid))
          
          // If direct lookup failed, try query by UID
          if (!userDoc.exists()) {
            const usersRef = collection(db, "users")
            const userQuery = query(usersRef, where("uid", "==", memberData.uid))
            const userSnapshot = await getDocs(userQuery)
            
            if (!userSnapshot.empty) {
              userDoc = userSnapshot.docs[0]
            }
          }
        } else if (memberData.userDocId) {
          // New path - direct lookup by document ID
          userDoc = await getDoc(doc(db, "users", memberData.userDocId))
        }
        
        // Create member object - handle cases where user doc doesn't exist
        let memberObject: TeamMember = {
          id: memberDoc.id,
          uid: memberData.uid || "pending",
          firstName: "",
          lastName: "",
          email: "pending@user.com",
          phone: "",
          role: memberData.role as string,
          createdAt: memberData.addedAt ? new Date(memberData.addedAt.seconds * 1000) : new Date(),
          updatedAt: memberData.addedAt ? new Date(memberData.addedAt.seconds * 1000) : new Date(),
          status: memberData.status as string || "active"
        };
        
        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data()
          
          // Get the user's name components, using displayName as fallback
          const firstName = userData.firstName || (userData.displayName ? userData.displayName.split(" ")[0] : "");
          const lastName = userData.lastName || (userData.displayName ? userData.displayName.split(" ").slice(1).join(" ") : "");
          
          // Update member object with user data
          memberObject = {
            ...memberObject,
            firstName: firstName,
            lastName: lastName,
            email: userData.email || memberObject.email,
            phone: userData.phone || "",
            status: userData.status || memberData.status || "active",
            // Safely handle dates
            createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date(),
            updatedAt: userData.updatedAt ? new Date(userData.updatedAt.seconds * 1000) : new Date(),
          };
        } else {
          // Make a more user-friendly display for members without user records
          if (memberData.status === "pending") {
            memberObject.firstName = "Pending";
            memberObject.lastName = "User";
          } else {
            memberObject.firstName = "User";
            memberObject.lastName = `ID: ${(memberData.uid || "").substring(0, 6)}...`;
          }
        }
        
        members.push(memberObject)
      }
      
      // Sort by role (admin first, then analyst, then user) and then by name
      members.sort((a, b) => {
        const roleOrder: Record<string, number> = { admin: 0, analyst: 1, user: 2 };
        const roleA = roleOrder[a.role as keyof typeof roleOrder] || 999;
        const roleB = roleOrder[b.role as keyof typeof roleOrder] || 999;
        
        if (roleA !== roleB) return roleA - roleB;
        
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setTeamMembers(members)
      setFilteredMembers(members)
      
      // Update seats available
      if (subscription) {
        setSeatsAvailable(Math.max(0, subscription.seats - members.length))
      }
    } catch (error) {
      console.error("Error refreshing team members:", error)
      toast.error("Failed to refresh team members")
    }
  }
  
  // Bulk role update function
  const updateRolesToUser = async () => {
    if (!organization?.id || teamMembers.length === 0) {
      toast.error("No team members to update")
      return
    }
    
    try {
      setIsLoading(true)
      let successCount = 0;
      
      // Keep track of license adjustments
      const licenseAdjustments: Record<string, number> = {
        admin: 0,
        analyst: 0,
        user: 0
      };
      
      for (const member of teamMembers) {
        if (member.role !== "user") {
          try {
            // Adjust license counts
            const oldRole = member.role.toLowerCase();
            const newRole = "user";
            
            // Decrement old role count
            licenseAdjustments[oldRole] -= 1;
            
            // Increment new role count
            licenseAdjustments[newRole] += 1;
            
            // Update organization member
            await updateDoc(doc(db, "organizations", organization.id, "members", member.id), {
              role: "user"
            })
            successCount++
          } catch (error) {
            console.error(`Error updating role for ${member.email}:`, error)
          }
        }
      }
      
      // Apply license adjustments to the organization document
      if (successCount > 0) {
        const orgRef = doc(db, "organizations", organization.id);
        const orgDoc = await getDoc(orgRef);
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          
          // Update license counts for each role
          const updates: Record<string, number> = {};
          
          for (const [role, adjustment] of Object.entries(licenseAdjustments)) {
            if (adjustment !== 0 && orgData.licenses && orgData.licenses[role]) {
              const currentUsed = orgData.licenses[role].used || 0;
              const newValue = Math.max(0, currentUsed + adjustment);
              
              updates[`licenses.${role}.used`] = newValue;
              console.log(`Adjusting ${role} license count: ${currentUsed} -> ${newValue}`);
            }
          }
          
          // Apply all updates at once
          if (Object.keys(updates).length > 0) {
            await updateDoc(orgRef, updates);
          }
        }
        
        toast.success(`Updated ${successCount} team member(s) to User role`)
        // Refresh members list
        await refreshTeamMembers()
      } else {
        toast.info("No roles were updated")
      }
    } catch (error) {
      console.error("Error in bulk role update:", error)
      toast.error("Failed to update roles")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Check if we can add more users
  const canAddUsers = seatsAvailable > 0
  
  // Handle adding a new team member
  const handleAddMember = async () => {
    if (!organization?.id) return;
    
    // Validate form
    if (!newMemberData.firstName.trim()) {
      toast.error("Please enter a first name");
      return;
    }
    if (!newMemberData.lastName.trim()) {
      toast.error("Please enter a last name");
      return;
    }
    if (!newMemberData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call our new direct user creation API
      const response = await fetch('/api/team/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: newMemberData.firstName,
          lastName: newMemberData.lastName,
          email: newMemberData.email,
          phone: newMemberData.phone,
          role: newMemberData.role,
          organizationId: organization.id,
        }),
      });
      
      const data = await response.json();
      console.log("API response:", data);
      
      if (response.ok) {
        if (data.partialSuccess) {
          // User was created in Auth but had issues with other steps
          toast.success(`${newMemberData.firstName} ${newMemberData.lastName} account created`);
          toast.warning("Some operations didn't complete. The user may need to be set up manually.");
          console.warn("Partial success:", data.message);
        } else {
          toast.success(`${newMemberData.firstName} ${newMemberData.lastName} has been added successfully`);
        }
        
        // Reset form and close dialog
        setNewMemberData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "user",
          password: "",
          confirmPassword: "",
        });
        setIsAddDialogOpen(false);
        
        // Reload team members
        await refreshTeamMembers();
      } else {
        // Display the specific error message from the API
        toast.error(data.message || 'Error creating user');
      }
    } catch (error: any) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle updating a member
  const handleUpdateMember = async () => {
    if (!organization?.id || !selectedMember) {
      toast.error("Member not found")
      return
    }
    
    try {
      // Find the original member to check if role has changed
      const originalMember = teamMembers.find(m => m.id === selectedMember.id);
      const roleChanged = originalMember && originalMember.role !== selectedMember.role;
      
      // Update user document
      const usersRef = collection(db, "users")
      const userQuery = query(usersRef, where("uid", "==", selectedMember.uid))
      const userSnapshot = await getDocs(userQuery)
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0]
        await updateDoc(doc(db, "users", userDoc.id), {
          firstName: selectedMember.firstName,
          lastName: selectedMember.lastName,
          email: selectedMember.email,
          phone: selectedMember.phone || "",
          updatedAt: new Date(),
        })
      }
      
      // Update organization member
      await updateDoc(doc(db, "organizations", organization.id, "members", selectedMember.id), {
        role: selectedMember.role,
      })
      
      // Update license counts if role has changed
      if (roleChanged && originalMember) {
        const oldRole = originalMember.role.toLowerCase();
        const newRole = selectedMember.role.toLowerCase();
        
        const orgRef = doc(db, "organizations", organization.id);
        const orgDoc = await getDoc(orgRef);
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const updates: Record<string, number> = {};
          
          // Decrement the old role count
          if (orgData.licenses && orgData.licenses[oldRole]) {
            const oldRoleUsed = orgData.licenses[oldRole].used || 0;
            updates[`licenses.${oldRole}.used`] = Math.max(0, oldRoleUsed - 1);
          }
          
          // Increment the new role count
          if (orgData.licenses && orgData.licenses[newRole]) {
            const newRoleUsed = orgData.licenses[newRole].used || 0;
            updates[`licenses.${newRole}.used`] = newRoleUsed + 1;
          }
          
          // Apply all updates if there are any
          if (Object.keys(updates).length > 0) {
            await updateDoc(orgRef, updates);
            console.log(`Updated license counts: ${oldRole} (-1), ${newRole} (+1)`);
          }
        }
      }
      
      toast.success("Team member updated successfully")
      
      // Close dialog and refresh team members
      setIsEditDialogOpen(false)
      
      const updatedMembers = teamMembers.map(member => 
        member.id === selectedMember.id ? selectedMember : member
      )
      
      setTeamMembers(updatedMembers)
      setFilteredMembers(updatedMembers)
    } catch (error) {
      console.error("Error updating team member:", error)
      toast.error("Failed to update team member")
    }
  }
  
  // Handle deleting a member
  const handleDeleteMember = async () => {
    if (!organization?.id || !selectedMember) {
      toast.error("Member not found")
      return
    }
    
    try {
      // Get the member's role before deletion
      const memberRole = selectedMember.role.toLowerCase(); // "admin", "analyst", or "user"
      
      // Delete from organization
      await deleteDoc(doc(db, "organizations", organization.id, "members", selectedMember.id))
      
      // Update the specific license count based on role
      const orgRef = doc(db, "organizations", organization.id);
      const orgDoc = await getDoc(orgRef);
      
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        
        // Check if licenses structure exists
        if (orgData.licenses && orgData.licenses[memberRole]) {
          // Update the used count for the specific license type
          const currentUsed = orgData.licenses[memberRole].used || 0;
          
          // Ensure we don't go below zero
          const newUsed = Math.max(0, currentUsed - 1);
          
          await updateDoc(orgRef, {
            [`licenses.${memberRole}.used`]: newUsed
          });
          
          console.log(`Updated ${memberRole} license count: ${currentUsed} -> ${newUsed}`);
        } else {
          console.warn(`License structure for ${memberRole} not found in organization data`);
        }
      }
      
      // Note: We don't delete the user from Firebase Auth or the users collection
      // This is because they might be a member of other organizations
      
      toast.success("Team member removed from organization")
      
      // Close alert and refresh team members
      setIsDeleteAlertOpen(false)
      
      const updatedMembers = teamMembers.filter(member => member.id !== selectedMember.id)
      
      setTeamMembers(updatedMembers)
      setFilteredMembers(updatedMembers)
      
      // Update seats available
      if (subscription) {
        setSeatsAvailable(Math.max(0, subscription.seats - updatedMembers.length))
      }
    } catch (error) {
      console.error("Error deleting team member:", error)
      toast.error("Failed to remove team member from organization")
    }
  }
  
  // Handle password reset
  const handleResetPassword = async () => {
    if (!selectedMember) {
      toast.error("Member not found")
      return
    }
    
    if (!newPassword) {
      toast.error("New password is required")
      return
    }
    
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    try {
      // In a real application with Firebase Admin SDK, we would set the password directly
      // For this client-side implementation, we'll show both options:
      // 1. Send a reset email (only option available on client-side)
      // 2. Mock direct password reset for demonstration

      // Option 1: Send reset email
      const auth = getAuth()
      await sendPasswordResetEmail(auth, selectedMember.email)
      
      // Option 2: Mock direct password reset 
      // This is just for UI demonstration since we can't directly set passwords client-side
      // In a real implementation, this would be done with Firebase Admin SDK on the server
      
      toast.success(`Password reset link sent to ${selectedMember.email}`)
      toast.info("In production with Admin SDK, the password would be directly reset")
      
      setIsResetPasswordDialogOpen(false)
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error("Failed to reset password")
    }
  }
  
  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </span>
        )
      case "analyst":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <UserCog className="w-3 h-3 mr-1" />
            Analyst
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <User className="w-3 h-3 mr-1" />
            User
          </span>
        )
    }
  }
  
  // Add a function to get a status badge
  const getStatusBadge = (status: string = "active") => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertOctagon className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case "disabled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertOctagon className="w-3 h-3 mr-1" />
            Disabled
          </span>
        )
      default:
        return null
    }
  }
  
  // Process user data for display
  const processUserData = (userData: any, id: string) => {
    return {
      id,
      ...userData,
      createdAt: toDate(userData.createdAt) || new Date(),
      updatedAt: toDate(userData.updatedAt) || new Date(),
      lastLogin: userData.lastLogin ? toDate(userData.lastLogin) : null,
    };
  };
  
  // Add helper to render member cells based on status
  const renderMemberName = (member: TeamMember) => {
    if (member.status === "pending") {
      return (
        <div className="flex flex-col">
          <div className="font-medium flex items-center">
            <span>{member.firstName} {member.lastName}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 ml-2"
              onClick={() => setIsInfoDialogOpen(true)}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">Pending activation</div>
        </div>
      );
    }
    
    return (
      <span className="font-medium">
        {member.firstName} {member.lastName}
      </span>
    );
  };
  
  // Helper function to manually activate a pending user
  const activatePendingUser = async (member: TeamMember) => {
    toast.info("In a production environment, this would activate the user in Firebase Auth");
    toast.info("This requires Firebase Admin SDK, which is typically done in a Cloud Function");
    
    // For now, just mark the user as active in the UI
    const updatedMembers = teamMembers.map(m => 
      m.id === member.id ? { ...m, status: "active" as const } : m
    );
    
    setTeamMembers(updatedMembers);
    setFilteredMembers(updatedMembers.filter(m => 
      searchQuery.trim() === "" || 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
    ));
  };
  
  // Migrate a pending user to active
  const migratePendingUser = async (memberDoc: any) => {
    try {
      const memberData = memberDoc.data();
      if (memberData.status === "pending" && memberData.userDocId) {
        const pendingUserDoc = await getDoc(doc(db, "users", memberData.userDocId));
        
        if (pendingUserDoc.exists()) {
          const userData = pendingUserDoc.data();
          
          // Call our API to create the user properly
          const response = await fetch('/api/team/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: userData.firstName || "Unknown",
              lastName: userData.lastName || "User",
              email: userData.email || "",
              phone: userData.phone || "",
              role: memberData.role || "user",
              organizationId: organization?.id || "",
            }),
          });
          
          if (response.ok) {
            // Delete the old member document
            await deleteDoc(doc(db, "organizations", organization!.id, "members", memberDoc.id));
            
            // Success message
            toast.success(`User ${userData.firstName} ${userData.lastName} has been migrated to the new system`);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error migrating pending user:", error);
      return false;
    }
  };

  // Add button to migrate users
  const handleMigratePendingUsers = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      // Get all members for this organization
      const membersRef = collection(db, "organizations", organization.id, "members");
      const membersSnapshot = await getDocs(membersRef);
      
      let migratedCount = 0;
      
      // Process each member
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        if (memberData.status === "pending" && memberData.userDocId) {
          const migrated = await migratePendingUser(memberDoc);
          if (migrated) migratedCount++;
        }
      }
      
      if (migratedCount > 0) {
        toast.success(`Successfully migrated ${migratedCount} pending users`);
        await refreshTeamMembers();
      } else {
        toast.info("No pending users found to migrate");
      }
    } catch (error) {
      console.error("Error migrating pending users:", error);
      toast.error("Failed to migrate pending users");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <div className="flex space-x-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canAddUsers}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new team member to your organization. They will receive an email with their login credentials.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">
                        First Name
                      </label>
                      <Input 
                        id="firstName" 
                        value={newMemberData.firstName}
                        onChange={(e) => setNewMemberData({...newMemberData, firstName: e.target.value})}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </label>
                      <Input 
                        id="lastName" 
                        value={newMemberData.lastName}
                        onChange={(e) => setNewMemberData({...newMemberData, lastName: e.target.value})}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input 
                      id="email" 
                      type="email"
                      value={newMemberData.email}
                      onChange={(e) => setNewMemberData({...newMemberData, email: e.target.value})}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone (Optional)
                    </label>
                    <Input 
                      id="phone" 
                      value={newMemberData.phone}
                      onChange={(e) => setNewMemberData({...newMemberData, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <Select 
                      value={newMemberData.role}
                      onValueChange={(value) => setNewMemberData({...newMemberData, role: value})}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        A secure password will be generated automatically and sent to the user via email.
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage users in your organization. Control who has access to your safety data.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{teamMembers.length}</span> / <span className="font-semibold text-foreground">{subscription?.seats || 0}</span> seats used
                  <div className="text-xs">
                    {seatsAvailable} available
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <span className="mr-2">Bulk Actions</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsCsvUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Users from CSV
                  </DropdownMenuItem>
                  {teamMembers.some(member => member.status === "pending") && (
                    <DropdownMenuItem onClick={handleMigratePendingUsers} disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {isLoading ? "Migrating..." : "Migrate Pending Users"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          {/* Migration Banner - only show if there are pending users */}
          {teamMembers.some(member => member.status === "pending") && (
            <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start space-x-4">
                <AlertOctagon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800">Legacy User Records Detected</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Some users were created with the old system and need to be migrated to the new direct account creation system.
                  </p>
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      className="bg-white hover:bg-amber-50 border-amber-300 text-amber-800"
                      onClick={handleMigratePendingUsers}
                      disabled={isLoading}
                    >
                      {isLoading ? "Migrating Users..." : "Migrate All Pending Users"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, email or phone..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-md">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No team members found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchQuery ? "No members match your search criteria." : "Add your first team member to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {renderMemberName(member)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <span className="flex items-center text-sm">
                              <Mail className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                              {member.email}
                            </span>
                            {member.phone && (
                              <span className="flex items-center text-sm">
                                <Phone className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                {member.phone}
                              </span>
                            )}
                            {member.status && member.status !== "active" && (
                              <span className="mt-1">
                                {getStatusBadge(member.status)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMember(member)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMember(member)
                                  setIsResetPasswordDialogOpen(true)
                                  setNewPassword("")
                                  setConfirmNewPassword("")
                                }}
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedMember(member)
                                  setIsDeleteAlertOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                              {member.status === "pending" && (
                                <DropdownMenuItem onClick={() => activatePendingUser(member)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground flex justify-between">
            {filteredMembers.length > 0 && (
              <div>Showing {filteredMembers.length} of {teamMembers.length} team members</div>
            )}
            {!canAddUsers && (
              <div className="text-amber-600 flex items-center">
                <AlertOctagon className="w-4 h-4 mr-1.5" />
                You've reached your seat limit
              </div>
            )}
          </CardFooter>
        </Card>
        
        {/* Edit Member Dialog */}
        {selectedMember && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Edit Team Member</DialogTitle>
                <DialogDescription>
                  Update information for {selectedMember.firstName} {selectedMember.lastName}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="firstName">First Name</label>
                    <Input
                      id="firstName"
                      value={selectedMember.firstName}
                      onChange={(e) => setSelectedMember({ ...selectedMember, firstName: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="lastName">Last Name</label>
                    <Input
                      id="lastName"
                      value={selectedMember.lastName}
                      onChange={(e) => setSelectedMember({ ...selectedMember, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedMember.email}
                    onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="phone">Phone (Optional)</label>
                  <Input
                    id="phone"
                    value={selectedMember.phone}
                    onChange={(e) => setSelectedMember({ ...selectedMember, phone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="role">Role</label>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(value) => setSelectedMember({ ...selectedMember, role: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateMember}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Reset Password Dialog */}
        {selectedMember && (
          <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Set a new password for {selectedMember.firstName} {selectedMember.lastName}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                  <p className="font-medium">Note about password reset</p>
                  <p className="mt-1">
                    For security reasons, this demo can only send a password reset email. In a production environment with Firebase Admin SDK, you would be able to set the password directly.
                  </p>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showResetPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                    >
                      {showResetPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmResetPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                    >
                      {showConfirmResetPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleResetPassword}>Reset Password</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Delete Member Alert */}
        {selectedMember && (
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {selectedMember.firstName} {selectedMember.lastName} from your organization? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDeleteMember}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* Info Dialog */}
        <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>About Team Management</DialogTitle>
              <DialogDescription>
                How user creation works in your safety platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">User Creation Process</h4>
                <p className="text-sm text-muted-foreground">
                  When you add a new team member:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>The system creates a complete account with a secure temporary password</li>
                  <li>An email is sent to the user with their login credentials</li>
                  <li>The user can immediately log in with the provided credentials</li>
                  <li>They should change their password after first login for security</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">User Roles</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li><strong>Admin:</strong> Full access to all platform features and team management</li>
                  <li><strong>Analyst:</strong> Can view, analyze, and report on safety data</li>
                  <li><strong>User:</strong> Basic access to submit forms and view relevant information</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsInfoDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 