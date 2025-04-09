"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ThumbsUp, Thermometer } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Removed automatic redirect to allow users to access the home page
  
  // Check if user is an admin or analyst
  const isAdminOrAnalyst = user?.role === "admin" || user?.role === "analyst"
  
  return (
    <MainLayout>
      <div className="container px-4 md:px-6 py-10 md:py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome to Safety-Simple!
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Your complete solution for environmental, health, and safety management
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center mt-8 gap-4">
            {!user ? (
              <>
                <Button asChild size="lg">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/signup">Create Account</Link>
                </Button>
              </>
            ) : isAdminOrAnalyst ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : null}
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="rounded-full w-12 h-12 bg-blue-100 flex items-center justify-center mb-4">
                <AlertTriangle className="text-blue-500 h-6 w-6" />
              </div>
              <CardTitle>Report an Incident</CardTitle>
              <CardDescription>
                Report incidents related to injuries, vehicle accidents, or environmental spills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our easy-to-use forms guide you through the reporting process, ensuring all relevant information is captured.
              </p>
              {user ? (
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href="/dashboard/incidents">Report Incident</Link>
                </Button>
              ) : (
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href="/login">Log In to Report</Link>
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="rounded-full w-12 h-12 bg-orange-100 flex items-center justify-center mb-4">
                <Thermometer className="text-orange-500 h-6 w-6" />
              </div>
              <CardTitle>Heat Illness Prevention</CardTitle>
              <CardDescription>
                Check weather conditions and heat index to take appropriate precautions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stay ahead of dangerous working conditions with our heat monitoring tools and alerts.
              </p>
              {user ? (
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href="/heat/check-weather">Heat Prevention</Link>
                </Button>
              ) : (
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href="/login">Log In to Access</Link>
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="rounded-full w-12 h-12 bg-green-100 flex items-center justify-center mb-4">
                <ThumbsUp className="text-green-500 h-6 w-6" />
              </div>
              <CardTitle>Employee Recognition</CardTitle>
              <CardDescription>
                Recognize safety awareness and proactive measures taken by employees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build a positive safety culture by acknowledging and rewarding good safety practices.
              </p>
              {user ? (
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href="/dashboard/recognition">Recognition Program</Link>
                </Button>
              ) : (
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href="/login">Log In to Access</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

