"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  increment,
  addDoc
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-context"
import { Organization, UserData } from "@/src/types/organization"
import { processFirestoreData } from "@/lib/firebase-utils"

interface OrganizationContextType {
  organization: Organization | null
  isLoading: boolean
  createOrganization: (name: string, plan: "starter" | "professional" | "enterprise", seatsTotal: number) => Promise<string>
  updateOrganization: (orgData: Partial<Organization>) => Promise<void>
  updateOrganizationSettings: (settings: Partial<Organization['settings']>) => Promise<void>
  addUserToOrganization: (userId: string, role: UserData['role']) => Promise<void>
  removeUserFromOrganization: (userId: string) => Promise<void>
  getOrganizationUsers: () => Promise<UserData[]>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadOrganization() {
      setIsLoading(true)
      
      if (!user || !user.organizationId) {
        setOrganization(null)
        setIsLoading(false)
        return
      }

      try {
        const orgDocRef = doc(db, "organizations", user.organizationId)
        const orgDoc = await getDoc(orgDocRef)
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data() as Omit<Organization, "id">
          
          // Handle the new subscription-based structure
          const orgWithDates = processFirestoreData(orgData)
          
          // Set the ID which was missing
          const completeOrg: Organization = {
            id: orgDoc.id,
            ...orgWithDates
          }
          
          setOrganization(completeOrg)
        } else {
          setOrganization(null)
        }
      } catch (error) {
        console.error("Error loading organization:", error)
        setOrganization(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrganization()
  }, [user])

  const createOrganization = async (
    name: string, 
    plan: "starter" | "professional" | "enterprise", 
    seatsTotal: number
  ): Promise<string> => {
    if (!user) throw new Error("User must be logged in to create an organization")
    
    try {
      // Create a new organization doc with auto-generated ID
      const orgRef = doc(collection(db, "organizations"))
      
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1) // 1 year license by default
      
      const newOrg: Omit<Organization, "id"> = {
        name,
        createdAt: new Date(),
        settings: {
          allowSelfRegistration: false,
          requireApprovalForSubmissions: true,
          logoURL: "",
          primaryColor: "#1e3a8a", // Default primary color
          secondaryColor: "#60a5fa" // Default secondary color
        },
        license: {
          plan,
          seatsTotal,
          seatsUsed: 1, // Starting with the creator
          expiresAt: expirationDate
        }
      }
      
      await setDoc(orgRef, {
        ...newOrg,
        createdAt: serverTimestamp(),
        license: {
          ...newOrg.license,
          expiresAt: serverTimestamp(), // Will be adjusted on the server
        }
      })
      
      // Update the user to be part of this organization as admin
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, {
        organizationId: orgRef.id,
        role: "admin"
      })
      
      // Also add the user to the organization's members collection
      await setDoc(doc(collection(db, "organizations", orgRef.id, "members")), {
        uid: user.uid,
        role: "admin",
        addedAt: serverTimestamp()
      })
      
      return orgRef.id
    } catch (error) {
      console.error("Error creating organization:", error)
      throw error
    }
  }

  const updateOrganization = async (orgData: Partial<Organization>): Promise<void> => {
    if (!user || !organization) throw new Error("No active organization")
    if (user.role !== "admin") throw new Error("Only admins can update organization details")
    
    try {
      const orgRef = doc(db, "organizations", organization.id)
      await updateDoc(orgRef, { ...orgData })
      
      // Update local state
      setOrganization((prev: Organization | null) => prev ? { ...prev, ...orgData } : null)
    } catch (error) {
      console.error("Error updating organization:", error)
      throw error
    }
  }

  const updateOrganizationSettings = async (settings: Partial<Organization['settings']>): Promise<void> => {
    if (!user || !organization) throw new Error("No active organization")
    if (user.role !== "admin") throw new Error("Only admins can update organization settings")
    
    try {
      const orgRef = doc(db, "organizations", organization.id)
      
      // Create an object with only the "settings.X" properties that need updating
      const updates = Object.entries(settings).reduce((acc, [key, value]) => {
        acc[`settings.${key}`] = value
        return acc
      }, {} as Record<string, any>)
      
      await updateDoc(orgRef, updates)
      
      // Update local state
      setOrganization((prev: Organization | null) => 
        prev ? { 
          ...prev, 
          settings: { ...prev.settings, ...settings } 
        } : null
      )
    } catch (error) {
      console.error("Error updating organization settings:", error)
      throw error
    }
  }

  const addUserToOrganization = async (userId: string, role: UserData['role']): Promise<void> => {
    if (!user || !organization) throw new Error("No active organization")
    if (user.role !== "admin") throw new Error("Only admins can add users to the organization")
    
    if (organization.license.seatsUsed >= organization.license.seatsTotal) {
      throw new Error("License seat limit reached. Please upgrade your plan or remove inactive users.")
    }
    
    try {
      // Check if user exists
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error("User not found")
      }
      
      const userData = userDoc.data() as Omit<UserData, "id">
      
      // Check if user is already in another organization
      if (userData.organizationId && userData.organizationId !== organization.id) {
        throw new Error("User already belongs to another organization")
      }
      
      // Update user with organization ID and role
      await updateDoc(userRef, {
        organizationId: organization.id,
        role
      })
      
      // Add user to organization members collection
      await addDoc(collection(db, "organizations", organization.id, "members"), {
        uid: userId,
        role,
        addedAt: serverTimestamp()
      })
      
      // Increment seats used in organization
      const orgRef = doc(db, "organizations", organization.id)
      await updateDoc(orgRef, {
        "license.seatsUsed": increment(1)
      })
      
      // Update local state
      setOrganization((prev: Organization | null) => 
        prev ? {
          ...prev,
          license: {
            ...prev.license,
            seatsUsed: prev.license.seatsUsed + 1
          }
        } : null
      )
    } catch (error) {
      console.error("Error adding user to organization:", error)
      throw error
    }
  }

  const removeUserFromOrganization = async (userId: string): Promise<void> => {
    if (!user || !organization) throw new Error("No active organization")
    if (user.role !== "admin") throw new Error("Only admins can remove users from the organization")
    
    // Admin cannot remove themselves
    if (userId === user.id) {
      throw new Error("Admins cannot remove themselves from the organization")
    }
    
    try {
      // Update user to remove organization ID
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        organizationId: "",
        role: "user"
      })
      
      // Decrement seats used in organization
      const orgRef = doc(db, "organizations", organization.id)
      await updateDoc(orgRef, {
        "license.seatsUsed": increment(-1)
      })
      
      // Update local state
      setOrganization((prev: Organization | null) => 
        prev ? {
          ...prev,
          license: {
            ...prev.license,
            seatsUsed: Math.max(0, prev.license.seatsUsed - 1)
          }
        } : null
      )
    } catch (error) {
      console.error("Error removing user from organization:", error)
      throw error
    }
  }

  const getOrganizationUsers = async (): Promise<UserData[]> => {
    if (!user || !organization) throw new Error("No active organization")
    
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("organizationId", "==", organization.id))
      const querySnapshot = await getDocs(q)
      
      const users: UserData[] = []
      querySnapshot.forEach(doc => {
        const userData = doc.data() as Omit<UserData, "id">
        
        // Process the data to convert timestamps
        const processedData = processFirestoreData(userData)
        
        users.push({
          id: doc.id,
          ...processedData
        })
      })
      
      return users
    } catch (error) {
      console.error("Error fetching organization users:", error)
      throw error
    }
  }

  return (
    <OrganizationContext.Provider 
      value={{
        organization,
        isLoading,
        createOrganization,
        updateOrganization,
        updateOrganizationSettings,
        addUserToOrganization,
        removeUserFromOrganization,
        getOrganizationUsers
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
} 