"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ThumbsUp, Thermometer } from "lucide-react"
import Link from "next/link"
import { FeatureCard } from "@/components/ui/feature-card"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Removed automatic redirect to allow users to access the home page
  
  // Check if user is an admin or analyst
  const isAdminOrAnalyst = user?.role === "admin" || user?.role === "analyst"
  
  return (
    <MainLayout>
      <div className="container px-4 md:px-6 py-8 md:py-12 lg:py-16 space-y-10 md:space-y-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to Safety-Simple!
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your complete solution for environmental, health, and safety management
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {!user ? (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/signup">Create Account</Link>
                </Button>
              </>
            ) : isAdminOrAnalyst ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : null}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={AlertTriangle}
            title="Report an Incident"
            description="Report incidents related to injuries, vehicle accidents, or environmental spills."
            iconColor="text-blue-500"
            iconBgColor="bg-blue-100"
            href={user ? "/dashboard/incidents" : "/login"}
            buttonText={user ? "Report Incident" : "Log In to Report"}
          >
            <p className="text-sm text-muted-foreground">
              Our easy-to-use forms guide you through the reporting process, ensuring all relevant information is captured.
            </p>
          </FeatureCard>
          
          <FeatureCard
            icon={Thermometer}
            title="Heat Illness Prevention"
            description="Check weather conditions and heat index to take appropriate precautions."
            iconColor="text-orange-500"
            iconBgColor="bg-orange-100"
            href={user ? "/heat/check-weather" : "/login"}
            buttonText={user ? "Heat Prevention" : "Log In to Access"}
          >
            <p className="text-sm text-muted-foreground">
              Stay ahead of dangerous working conditions with our heat monitoring tools and alerts.
            </p>
          </FeatureCard>
          
          <FeatureCard
            icon={ThumbsUp}
            title="Employee Recognition"
            description="Recognize safety awareness and proactive measures taken by employees."
            iconColor="text-green-500"
            iconBgColor="bg-green-100"
            href={user ? "/dashboard/recognition" : "/login"}
            buttonText={user ? "Recognition Program" : "Log In to Access"}
          >
            <p className="text-sm text-muted-foreground">
              Build a positive safety culture by acknowledging and rewarding good safety practices.
            </p>
          </FeatureCard>
        </div>
      </div>
    </MainLayout>
  )
}

