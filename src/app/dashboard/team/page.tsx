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
  AlertOctagon
} from "lucide-react"

interface TeamMember {
  id: string
  uid: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: "admin" | "analyst" | "user"
  createdAt: Date
  updatedAt: Date
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
  
  // Load team members and subscription data
  useEffect(() => {
    const loadTeamMembersAndSubscription = async () => {
      if (!organization?.id) return
      
      try {
        setIsLoading(true)
        
        // Load team members
        const membersRef = collection(db, "organizations", organization.id, "members")
        const membersQuery = query(membersRef)
        const membersSnapshot = await getDocs(membersQuery)
        
        const members: TeamMember[] = []
        
        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data()
          
          // Get the user document from the users collection to get the full profile
          const userDoc = await getDoc(doc(db, "users", memberData.uid))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            
            members.push({
              id: memberDoc.id,
              uid: memberData.uid,
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              email: userData.email || "",
              phone: userData.phone || "",
              role: memberData.role || "user",
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            })
          }
        }
        
        // Sort by role (admin first, then analyst, then user) and then by name
        members.sort((a, b) => {
          const roleOrder = { admin: 1, analyst: 2, user: 3 }
          const roleComparison = roleOrder[a.role] - roleOrder[b.role]
          
          if (roleComparison !== 0) return roleComparison
          
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
          return nameA.localeCompare(nameB)
        })
        
        setTeamMembers(members)
        setFilteredMembers(members)
        
        // Load subscription data
        const subscriptionRef = doc(db, "organizations", organization.id, "subscription", "current")
        const subscriptionSnapshot = await getDoc(subscriptionRef)
        
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
        const userDoc = await getDoc(doc(db, "users", memberData.uid))
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          members.push({
            id: memberDoc.id,
            uid: memberData.uid,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            role: memberData.role || "user",
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          })
        }
      }
      
      // Sort by role (admin first, then analyst, then user) and then by name
      members.sort((a, b) => {
        const roleOrder = { admin: 1, analyst: 2, user: 3 }
        const roleComparison = roleOrder[a.role] - roleOrder[b.role]
        
        if (roleComparison !== 0) return roleComparison
        
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })
      
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
      let successCount = 0
      
      for (const member of teamMembers) {
        if (member.role !== "user") {
          try {
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
      
      if (successCount > 0) {
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
  
  // Handle adding a new member
  const handleAddMember = async () => {
    if (!organization?.id) {
      toast.error("Organization not found")
      return
    }
    
    // Check if we have seats available
    if (seatsAvailable <= 0) {
      toast.error("No seats available. Please upgrade your subscription to add more users.")
      return
    }
    
    // Validation
    if (!newMemberData.firstName || !newMemberData.lastName || !newMemberData.email) {
      toast.error("First name, last name, and email are required")
      return
    }
    
    if (!newMemberData.password) {
      toast.error("Password is required")
      return
    }
    
    if (newMemberData.password !== newMemberData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    try {
      // Create the user in Firebase Auth
      const auth = getAuth()
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newMemberData.email,
        newMemberData.password
      )
      
      const uid = userCredential.user.uid
      
      // Create user document
      await addDoc(collection(db, "users"), {
        uid,
        firstName: newMemberData.firstName,
        lastName: newMemberData.lastName,
        email: newMemberData.email,
        phone: newMemberData.phone || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      // Add user to organization
      await addDoc(collection(db, "organizations", organization.id, "members"), {
        uid,
        role: newMemberData.role,
        addedAt: new Date(),
      })
      
      toast.success("Team member added successfully")
      
      // Reset form and close dialog
      setNewMemberData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "user",
        password: "",
        confirmPassword: "",
      })
      
      setIsAddDialogOpen(false)
      
      // Refresh team members
      const membersRef = collection(db, "organizations", organization.id, "members")
      const membersQuery = query(membersRef)
      const membersSnapshot = await getDocs(membersQuery)
      
      const members: TeamMember[] = []
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data()
        const userDoc = await getDoc(doc(db, "users", memberData.uid))
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          members.push({
            id: memberDoc.id,
            uid: memberData.uid,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            role: memberData.role || "user",
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          })
        }
      }
      
      setTeamMembers(members)
      setFilteredMembers(members)
      
      // Update seats available
      if (subscription) {
        setSeatsAvailable(Math.max(0, subscription.seats - members.length))
      }
    } catch (error: any) {
      console.error("Error adding team member:", error)
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already in use by another account")
      } else {
        toast.error("Failed to add team member")
      }
    }
  }
  
  // Handle updating a member
  const handleUpdateMember = async () => {
    if (!organization?.id || !selectedMember) {
      toast.error("Member not found")
      return
    }
    
    try {
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
      // Delete from organization
      await deleteDoc(doc(db, "organizations", organization.id, "members", selectedMember.id))
      
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
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <div className="flex items-center space-x-2">
          <Dialog open={isCsvUploadDialogOpen} onOpenChange={setIsCsvUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!canAddUsers}>
                <Upload className="w-4 h-4 mr-2" />
                Import Users
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Import Team Members</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file with team member data to add multiple users at once.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                  <p className="font-medium flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    File Format Requirements
                  </p>
                  <p className="mt-1">
                    Your file should have these columns: firstName, lastName, email, password, phone (optional), role (optional).
                  </p>
                  <p className="mt-1">
                    Example: John,Doe,john.doe@example.com,password123,555-123-4567,user
                  </p>
                </div>
                
                {!canAddUsers && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
                    <p className="font-medium flex items-center">
                      <AlertOctagon className="w-4 h-4 mr-2" />
                      No Seats Available
                    </p>
                    <p className="mt-1">
                      You've reached your seat limit. Please remove unused users or upgrade your subscription to add more team members.
                    </p>
                  </div>
                )}
                
                {canAddUsers && (
                  <>
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="csvFile">Upload File</label>
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Accepted formats: CSV, Excel (.xlsx, .xls)
                      </p>
                    </div>
                    
                    {csvData.length > 0 && (
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted p-2 text-sm font-medium">
                          Preview: {csvData.length} users found
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {csvData.slice(0, 5).map((row, index) => (
                                <TableRow key={index}>
                                  <TableCell>{row.firstName} {row.lastName}</TableCell>
                                  <TableCell>{row.email}</TableCell>
                                  <TableCell>{row.role || "user"}</TableCell>
                                </TableRow>
                              ))}
                              {csvData.length > 5 && (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    ...and {csvData.length - 5} more
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    
                    {csvData.length > 0 && seatsAvailable < csvData.length && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
                        <p className="font-medium flex items-center">
                          <AlertOctagon className="w-4 h-4 mr-2" />
                          Not Enough Seats
                        </p>
                        <p className="mt-1">
                          You have {seatsAvailable} seats available but are trying to add {csvData.length} users.
                          Please reduce the number of users in your file or upgrade your subscription.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCsvUploadDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={processImportedData} 
                  disabled={csvData.length === 0 || isCsvProcessing || seatsAvailable < csvData.length}
                >
                  {isCsvProcessing ? "Processing..." : "Import Users"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canAddUsers}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Team Member</DialogTitle>
                <DialogDescription>
                  Add a new team member to your organization. They will receive an email invitation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="firstName">First Name</label>
                    <Input
                      id="firstName"
                      value={newMemberData.firstName}
                      onChange={(e) => setNewMemberData({ ...newMemberData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="lastName">Last Name</label>
                    <Input
                      id="lastName"
                      value={newMemberData.lastName}
                      onChange={(e) => setNewMemberData({ ...newMemberData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="phone">Phone (Optional)</label>
                  <Input
                    id="phone"
                    value={newMemberData.phone}
                    onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="role">Role</label>
                  <Select
                    value={newMemberData.role}
                    onValueChange={(value) => setNewMemberData({ ...newMemberData, role: value as any })}
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
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="password">Password</label>
                  <Input
                    id="password"
                    type="password"
                    value={newMemberData.password}
                    onChange={(e) => setNewMemberData({ ...newMemberData, password: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newMemberData.confirmPassword}
                    onChange={(e) => setNewMemberData({ ...newMemberData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage users in your organization. Control who has access to your safety data.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {teamMembers.length} / {subscription?.seats || 0} seats used
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seatsAvailable} available
                    </p>
                  </div>
                </div>
              </div>
              {teamMembers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserCog className="h-4 w-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Role Management</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={updateRolesToUser}>
                      <User className="mr-2 h-4 w-4" />
                      Set All to User Role
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
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
                        {member.firstName} {member.lastName}
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
                            <DropdownMenuSeparator />
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
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
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
    </div>
  )
} 