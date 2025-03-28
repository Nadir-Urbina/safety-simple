"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart, 
  ClipboardList, 
  AlertTriangle, 
  Thermometer, 
  Award, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  FileText,
  Inbox,
  PlusCircle,
  FilePlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { organization } = useOrganization()

  // Handle hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Analytics & Reports",
      href: "/dashboard/analytics",
      icon: <BarChart className="h-5 w-5" />,
      roles: ["admin", "analyst"],
    },
    {
      title: "Forms",
      href: "/dashboard/forms",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Submissions",
      href: "/dashboard/forms/submissions",
      icon: <Inbox className="h-5 w-5" />,
      roles: ["admin", "analyst"],
    },
    {
      title: "Team",
      href: "/dashboard/team",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  // Filter nav items based on user role
  const userRole = user?.role || "user"
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  const NavItems = () => (
    <>
      {filteredNavItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
            pathname === item.href
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-accent-foreground"
          )}
          onClick={() => setIsMobileOpen(false)}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </>
  )

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Navigation */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 md:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <div className="p-6">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold"
                onClick={() => setIsMobileOpen(false)}
              >
                <FileText className="h-6 w-6" />
                <span>Safety Simple</span>
              </Link>
            </div>
            <ScrollArea className="flex-1 border-t">
              <div className="flex flex-col gap-1 p-4">
                <NavItems />
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex items-center gap-4 pb-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                  <AvatarFallback>
                    {user?.displayName ? getInitials(user.displayName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user?.displayName || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {organization?.name || "Organization"}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FileText className="h-6 w-6" />
          <span>Safety Simple</span>
        </Link>
      </div>

      <div className="flex flex-1">
        {/* Desktop navigation */}
        <aside className="hidden w-64 border-r bg-background md:flex md:flex-col">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <FileText className="h-6 w-6" />
              <span>Safety Simple</span>
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-4">
              <NavItems />
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <div className="flex items-center gap-4 pb-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                <AvatarFallback>
                  {user?.displayName ? getInitials(user.displayName) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.displayName || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {organization?.name || "Organization"}
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2" 
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
} 