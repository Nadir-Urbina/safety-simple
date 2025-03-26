"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { UserData } from "@/types"

interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            // User exists in Firestore, update with latest data
            const userData = userDoc.data() as Omit<UserData, "id">
            const createdAt = userData.createdAt ? userData.createdAt.toDate() : new Date();
            
            setUser({
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName || userData.displayName,
              email: firebaseUser.email || userData.email,
              photoURL: firebaseUser.photoURL || userData.photoURL,
              role: userData.role || "user",
              organizationId: userData.organizationId || "",
              department: userData.department,
              jobTitle: userData.jobTitle,
              createdAt: createdAt,
              lastLogin: new Date(),
            })

            // Update last login time
            await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })
          } else {
            // User doesn't exist in Firestore yet (first login)
            setUser({
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName || "User",
              email: firebaseUser.email || "",
              photoURL: firebaseUser.photoURL,
              role: "user", // Default role
              organizationId: "", // No organization assigned yet
              createdAt: new Date(),
              lastLogin: new Date(),
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Fallback to basic Firebase user data
          setUser({
            id: firebaseUser.uid,
            displayName: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL,
            role: "user", // Default role
            organizationId: "", // No organization assigned yet
            createdAt: new Date(),
            lastLogin: new Date(),
          })
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const { user: firebaseUser } = userCredential

      // Create user document in Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid)
      await setDoc(userDocRef, {
        displayName,
        email,
        role: "user", // Default role
        organizationId: "", // No organization assigned yet
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Error resetting password:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

