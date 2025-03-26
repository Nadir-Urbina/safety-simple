"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ArrowRight, CreditCard, Shield, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { LICENSE_PRICES } from "@/lib/stripe"

export default function SubscriptionPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // In a real app, you'd fetch this data from your database
  // For now, we'll use mock data
  const subscriptionData = {
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    licenses: {
      admin: { total: 1, used: 1 },
      analyst: { total: 2, used: 1 },
      user: { total: 10, used: 5 },
    },
  }
  
  const handleManageSubscription = async () => {
    if (!user || !user.organizationId) {
      toast({
        title: "Error",
        description: "You must be part of an organization to manage subscriptions",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: user.organizationId,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create portal session')
      }
      
      const { url } = await response.json()
      window.location.href = url
    } catch (error: any) {
      console.error("Error opening subscription portal:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription management portal",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout requireAuth={true}>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span>Subscription Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {subscriptionData.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span>{subscriptionData.currentPeriodEnd.toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>License Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      EHS Admin ({subscriptionData.licenses.admin.used} of {subscriptionData.licenses.admin.total})
                    </span>
                    <span className="text-sm font-medium">
                      ${LICENSE_PRICES.admin.toFixed(2)}/month each
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(subscriptionData.licenses.admin.used / subscriptionData.licenses.admin.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      Analyst ({subscriptionData.licenses.analyst.used} of {subscriptionData.licenses.analyst.total})
                    </span>
                    <span className="text-sm font-medium">
                      ${LICENSE_PRICES.analyst.toFixed(2)}/month each
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(subscriptionData.licenses.analyst.used / subscriptionData.licenses.analyst.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      User ({subscriptionData.licenses.user.used} of {subscriptionData.licenses.user.total})
                    </span>
                    <span className="text-sm font-medium">
                      ${LICENSE_PRICES.user.toFixed(2)}/month each
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(subscriptionData.licenses.user.used / subscriptionData.licenses.user.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                Adjust Licenses
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Billing Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your payment information is securely stored by Stripe, our payment processor. We never store your credit card details.
                </p>
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Your subscription is protected by industry-standard security measures.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
                asChild
              >
                <Link href="#" target="_blank">
                  <span>View Billing History</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">How do I upgrade my subscription?</h3>
              <p className="text-muted-foreground">
                You can upgrade your subscription by clicking "Manage Subscription" and selecting a new plan or adding additional licenses.
              </p>
            </div>
            <div>
              <h3 className="font-medium">What happens if I downgrade?</h3>
              <p className="text-muted-foreground">
                When downgrading, your new plan will take effect at the end of your current billing cycle. If you reduce the number of licenses below what you're currently using, you'll need to remove users first.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Can I cancel my subscription?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 