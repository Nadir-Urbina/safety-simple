"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, AlertTriangle, Thermometer, ThumbsUp, BarChart3, User } from "lucide-react"

interface MobileNavProps {
  isAdmin: boolean
}

export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname()

  const userNavItems = [
    {
      title: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Incidents",
      href: "/incidents",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Heat",
      href: "/heat",
      icon: <Thermometer className="h-5 w-5" />,
    },
    {
      title: "Recognition",
      href: "/recognition",
      icon: <ThumbsUp className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
  ]

  const adminNavItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <User className="h-5 w-5" />,
    },
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <div className="fixed bottom-0 left-0 z-50 h-16 w-full border-t bg-background md:hidden">
      <div className="grid h-full grid-cols-5">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              pathname === item.href && "text-foreground",
            )}
          >
            {item.icon}
            <span className="mt-1">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

