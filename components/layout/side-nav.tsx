"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  FileText,
  Home,
  AlertTriangle,
  Car,
  Droplets,
  Thermometer,
  ThumbsUp,
  Users,
  Settings,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function SideNav() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Incidents",
      href: "/admin/incidents",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Vehicle Accidents",
      href: "/admin/vehicle-accidents",
      icon: <Car className="h-5 w-5" />,
    },
    {
      title: "Environmental Spills",
      href: "/admin/environmental-spills",
      icon: <Droplets className="h-5 w-5" />,
    },
    {
      title: "Heat JSA",
      href: "/admin/heat-jsa",
      icon: <Thermometer className="h-5 w-5" />,
    },
    {
      title: "Recognition",
      href: "/admin/recognition",
      icon: <ThumbsUp className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-full w-60 flex-col">
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                  pathname === item.href && "bg-secondary text-foreground",
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

