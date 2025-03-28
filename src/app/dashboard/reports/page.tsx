"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReportsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the consolidated Analytics & Reports page
    router.replace("/dashboard/analytics")
  }, [router])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting to Analytics & Reports...</p>
      </div>
    </div>
  )
} 