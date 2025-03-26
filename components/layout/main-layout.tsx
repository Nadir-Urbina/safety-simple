"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { HeaderNav } from "./header-nav"
import { SideNav } from "./side-nav"
import { MobileNav } from "./mobile-nav"
import { useMobile } from "@/hooks/use-mobile"

interface MainLayoutProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function MainLayout({ children, requireAuth = true }: MainLayoutProps) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const isAdmin = pathname.startsWith("/admin")

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push("/login")
    }

    // Check if user is admin for admin routes
    if (!isLoading && isAdmin && user?.role !== "admin") {
      router.push("/")
    }
  }, [isLoading, user, requireAuth, router, isAdmin])

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

