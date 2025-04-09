"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, ShieldAlert } from "lucide-react"
import { HeaderNav } from "./header-nav"
import { SideNav } from "./side-nav"
import { MobileNav } from "./mobile-nav"
import { useMobile } from "@/hooks/use-mobile"

interface MainLayoutProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredRole?: "admin" | "analyst" | "user" | "any"
}

export function MainLayout({ 
  children, 
  requireAuth = true, 
  requiredRole = "any" 
}: MainLayoutProps) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const isAdmin = pathname.startsWith("/admin")

  // Define route permissions
  const restrictedRoutes = {
    // Admin-only routes
    "/dashboard/settings": ["admin"],
    "/dashboard/team": ["admin"],
    "/admin": ["admin"],
    
    // Admin or analyst routes 
    "/dashboard/forms": ["admin", "analyst"],
    "/dashboard/forms/builder": ["admin", "analyst"],
    "/dashboard/forms/templates": ["admin", "analyst"],
    "/dashboard/forms/view": ["admin", "analyst"],
    "/dashboard/forms/submissions": ["admin", "analyst"],
    "/dashboard/analytics": ["admin", "analyst"],
    
    // Accessible by all roles
    "/dashboard": ["admin", "analyst", "user"],
    "/profile": ["admin", "analyst", "user"],
    "/incidents": ["admin", "analyst", "user"],
    "/heat": ["admin", "analyst", "user"],
  }

  useEffect(() => {
    if (!isLoading) {
      // Authentication check
      if (requireAuth && !user) {
        router.push("/login")
        return
      }

      // Admin route check
      if (isAdmin && user?.role !== "admin") {
        router.push("/")
        return
      }

      // Role-based access check for specific routes
      if (user) {
        // First check if there's an exact match for the current path
        const allowedRoles = restrictedRoutes[pathname]
        
        // If no exact match, check if it starts with any restricted path
        if (!allowedRoles) {
          for (const [route, roles] of Object.entries(restrictedRoutes)) {
            if (pathname.startsWith(route) && !roles.includes(user.role)) {
              console.log(`Access denied to ${pathname} for role ${user.role}`)
              router.push("/")
              return
            }
          }
        } else if (!allowedRoles.includes(user.role)) {
          console.log(`Access denied to ${pathname} for role ${user.role}`)
          router.push("/")
          return
        }
      }

      // Component-specific role check
      if (requiredRole !== "any" && user?.role !== requiredRole) {
        router.push("/dashboard")
        return
      }
    }
  }, [isLoading, user, requireAuth, requiredRole, router, isAdmin, pathname])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Will redirect in useEffect
  }

  // Access denied page
  if (requiredRole !== "any" && user?.role !== requiredRole) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderNav />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <ShieldAlert className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
        {isMobile && <MobileNav isAdmin={isAdmin} />}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderNav />
      <div className="flex flex-1">
        {!isMobile && isAdmin && <SideNav />}
        <main className="flex-1">{children}</main>
      </div>
      {isMobile && <MobileNav isAdmin={isAdmin} />}
    </div>
  )
}

