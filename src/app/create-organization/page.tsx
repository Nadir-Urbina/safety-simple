"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Info, CheckCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { LICENSE_PRICES } from "@/lib/stripe"
import stripePromise from "@/lib/stripe"
import { Switch } from "@/components/ui/switch"
import { auth } from "@/lib/firebase"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  adminCount: z.number().min(1, {
    message: "You must have at least 1 admin seat.",
  }).max(100, {
    message: "Maximum 100 admin seats allowed.",
  }),
  analystCount: z.number().min(0, {
    message: "Analyst seats cannot be negative.",
  }).max(1000, {
    message: "Maximum 1000 analyst seats allowed.",
  }),
  userCount: z.number().min(0, {
    message: "User seats cannot be negative.",
  }).max(10000, {
    message: "Maximum 10000 user seats allowed.",
  }),
  billingCycle: z.enum(["monthly", "yearly"])
})

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      adminCount: 1,
      analystCount: 1,
      userCount: 5,
      billingCycle: "monthly"
    },
  })

  // Watch form values for real-time calculation
  const adminCount = form.watch("adminCount") || 0
  const analystCount = form.watch("analystCount") || 0
  const userCount = form.watch("userCount") || 0
  const billingCycle = form.watch("billingCycle")
  
  // Calculate discount percentage
  const yearlyDiscountPercentage = 20

  // Calculate monthly cost before any discounts
  const calculateBaseMonthlyTotal = () => {
    return (
      adminCount * LICENSE_PRICES.admin +
      analystCount * LICENSE_PRICES.analyst +
      userCount * LICENSE_PRICES.user
    )
  }

  // Calculate monthly cost with discount applied for yearly billing
  const calculateDiscountedMonthly = () => {
    const monthlyTotal = calculateBaseMonthlyTotal()
    return monthlyTotal * (1 - yearlyDiscountPercentage / 100)
  }

  // Calculate total cost with discount applied for yearly billing
  const calculateTotal = () => {
    if (billingCycle === "yearly") {
      // Apply 20% discount for yearly billing
      return calculateDiscountedMonthly().toFixed(2)
    }
    
    return calculateBaseMonthlyTotal().toFixed(2)
  }
  
  // Calculate yearly amount before discount
  const calculateTotalBeforeDiscount = () => {
    const monthlyTotal = calculateBaseMonthlyTotal()
    return (monthlyTotal * 12).toFixed(2)
  }

  // Calculate yearly amount after discount
  const calculateYearlyTotal = () => {
    const discountedMonthly = calculateDiscountedMonthly()
    return (discountedMonthly * 12).toFixed(2)
  }
  
  // Calculate how much they save per year with the yearly discount
  const calculateYearlySavings = () => {
    if (billingCycle === "yearly") {
      const regularYearly = calculateBaseMonthlyTotal() * 12
      const discountedYearly = calculateDiscountedMonthly() * 12
      return (regularYearly - discountedYearly).toFixed(2)
    }
    return "0.00"
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    try {
      if (!user) {
        throw new Error("You must be logged in to create an organization")
      }
      
      // Get the ID token from the current user
      const token = await auth.currentUser!.getIdToken();
      
      // Call our API route to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Add the authentication token
        },
        body: JSON.stringify({
          organizationName: values.name,
          adminCount: values.adminCount,
          analystCount: values.analystCount,
          userCount: values.userCount,
          billingCycle: values.billingCycle
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }
      
      const { id: sessionId } = await response.json()
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })
      
      if (error) {
        throw new Error(error.message || 'Failed to redirect to checkout')
      }
    } catch (error: any) {
      console.error("Error starting checkout:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process. Please try again.",
        variant: "destructive"
      })
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout requireAuth={true}>
      <div className="container max-w-2xl py-10">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground mb-8 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>
              Set up your organization and select your licensing plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your organization name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is how your organization will appear in the system.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      License Selection
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </h3>
                    
                    <div className="flex items-center space-x-6 p-2 rounded-lg bg-muted self-start">
                      <FormField
                        control={form.control}
                        name="billingCycle"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <div className="grid gap-1.5">
                              <div className="flex items-center">
                                <FormLabel className={field.value === "monthly" ? "font-semibold" : "text-muted-foreground"}>
                                  Monthly
                                </FormLabel>
                              </div>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value === "yearly"}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? "yearly" : "monthly")
                                }}
                              />
                            </FormControl>
                            <div className="grid gap-1.5">
                              <div className="flex items-center">
                                <FormLabel className={field.value === "yearly" ? "font-semibold" : "text-muted-foreground"}>
                                  Yearly
                                </FormLabel>
                                {field.value === "yearly" && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Save 20%
                                  </span>
                                )}
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-md">
                      <div className="space-y-2 mb-4 sm:mb-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">EHS Admin</h4>
                          <div className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Required</div>
                        </div>
                        <p className="text-sm text-muted-foreground">Full access to all features and administrative controls</p>
                        <p className="text-sm font-semibold">
                          ${billingCycle === "yearly" 
                              ? (LICENSE_PRICES.admin * (1 - yearlyDiscountPercentage / 100)).toFixed(2) 
                              : LICENSE_PRICES.admin.toFixed(2)
                          } per month per license
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => form.setValue("adminCount", Math.max(1, adminCount - 1))}
                          disabled={adminCount <= 1}
                        >-</Button>
                        <FormField
                          control={form.control}
                          name="adminCount"
                          render={({ field }) => (
                            <FormItem className="flex-1 mx-2">
                              <FormControl>
                                <Input 
                                  className="w-16 text-center" 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  min={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => form.setValue("adminCount", adminCount + 1)}
                        >+</Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-md">
                      <div className="space-y-2 mb-4 sm:mb-0">
                        <h4 className="font-medium">Analyst</h4>
                        <p className="text-sm text-muted-foreground">Access to analytics dashboard and reporting features</p>
                        <p className="text-sm font-semibold">
                          ${billingCycle === "yearly" 
                              ? (LICENSE_PRICES.analyst * (1 - yearlyDiscountPercentage / 100)).toFixed(2) 
                              : LICENSE_PRICES.analyst.toFixed(2)
                          } per month per license
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => form.setValue("analystCount", Math.max(0, analystCount - 1))}
                          disabled={analystCount <= 0}
                        >-</Button>
                        <FormField
                          control={form.control}
                          name="analystCount"
                          render={({ field }) => (
                            <FormItem className="flex-1 mx-2">
                              <FormControl>
                                <Input 
                                  className="w-16 text-center" 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  min={0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => form.setValue("analystCount", analystCount + 1)}
                        >+</Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-md">
                      <div className="space-y-2 mb-4 sm:mb-0">
                        <h4 className="font-medium">User</h4>
                        <p className="text-sm text-muted-foreground">Basic access for field staff to submit reports</p>
                        <p className="text-sm font-semibold">
                          ${billingCycle === "yearly" 
                              ? (LICENSE_PRICES.user * (1 - yearlyDiscountPercentage / 100)).toFixed(2) 
                              : LICENSE_PRICES.user.toFixed(2)
                          } per month per license
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => form.setValue("userCount", Math.max(0, userCount - 1))}
                          disabled={userCount <= 0}
                        >-</Button>
                        <FormField
                          control={form.control}
                          name="userCount"
                          render={({ field }) => (
                            <FormItem className="flex-1 mx-2">
                              <FormControl>
                                <Input 
                                  className="w-16 text-center" 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  min={0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => form.setValue("userCount", userCount + 1)}
                        >+</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-md">
                    {billingCycle === "yearly" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Yearly Cost:</span>
                          <span className="text-xl font-bold">
                            ${calculateTotalBeforeDiscount()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium text-green-600">After Yearly Discount (20%):</span>
                          <span className="text-xl font-bold text-green-600">
                            ${calculateYearlyTotal()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 bg-green-50 p-2 rounded-md">
                          <span className="font-medium text-green-600">You Saved:</span>
                          <span className="font-bold text-green-600">
                            ${calculateYearlySavings()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm text-muted-foreground">Monthly equivalent:</span>
                          <span className="text-sm text-muted-foreground">
                            ${calculateTotal()}/month
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Monthly Cost:</span>
                        <span className="text-xl font-bold">
                          ${calculateTotal()}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      {billingCycle === "monthly" 
                        ? "Billed monthly. You can update your subscription at any time." 
                        : "Billed annually. Save 20% compared to monthly billing."}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Free 14-day trial</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Cancel at any time</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Upgrade or downgrade as needed</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span>20% discount applied for annual billing</span>
                    </div>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Proceed to Payment"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-center text-sm text-muted-foreground px-6">
              By creating an organization, you agree to our terms of service and privacy policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
} 