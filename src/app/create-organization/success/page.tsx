"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function OrganizationSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  
  useEffect(() => {
    // Start a countdown to automatically redirect to dashboard
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [router])
  
  return (
    <MainLayout requireAuth={true}>
      <div className="container max-w-md py-10">
        <Card className="text-center">
          <CardContent className="pt-10 pb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-6">Payment Successful!</h1>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Your organization has been created successfully!
              </h2>
              
              <p className="text-muted-foreground">
                You can now start using Safety-Simple to manage your safety program.
              </p>
              
              <p className="text-sm text-muted-foreground mt-8">
                Redirecting to dashboard in {countdown} seconds...
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="justify-center pb-6">
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
} 