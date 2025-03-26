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
import { ArrowLeft, Info } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const invitationCodeSchema = z.object({
  code: z.string().min(6, {
    message: "Invitation code must be at least 6 characters.",
  }),
})

const emailSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export default function JoinOrganizationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmittingCode, setIsSubmittingCode] = useState(false)
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)

  const codeForm = useForm<z.infer<typeof invitationCodeSchema>>({
    resolver: zodResolver(invitationCodeSchema),
    defaultValues: {
      code: "",
    },
  })

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmitCode(values: z.infer<typeof invitationCodeSchema>) {
    setIsSubmittingCode(true)
    
    try {
      // In a real app, this would call a function to validate and accept the invitation
      console.log("Submitting code:", values)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Success!",
        description: "You have joined the organization successfully.",
      })
      
      router.push("/")
    } catch (error) {
      console.error("Error joining organization:", error)
      toast({
        title: "Error",
        description: "Failed to join organization. Please check your invitation code and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingCode(false)
    }
  }

  async function onSubmitEmail(values: z.infer<typeof emailSchema>) {
    setIsSubmittingEmail(true)
    
    try {
      // In a real app, this would call a function to request an invitation
      console.log("Submitting email:", values)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Request Sent",
        description: "Your request to join an organization has been sent. You will be notified when it's approved.",
      })
      
      router.push("/")
    } catch (error) {
      console.error("Error requesting invitation:", error)
      toast({
        title: "Error",
        description: "Failed to request invitation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingEmail(false)
    }
  }

  return (
    <MainLayout requireAuth={true}>
      <div className="container max-w-md py-10">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground mb-8 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Join an Organization</CardTitle>
            <CardDescription>
              Connect with your company's Safety-Simple account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="code">Invitation Code</TabsTrigger>
                <TabsTrigger value="email">Request Access</TabsTrigger>
              </TabsList>
              
              <TabsContent value="code">
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Invitation Required</AlertTitle>
                  <AlertDescription>
                    Enter the invitation code provided by your organization administrator.
                  </AlertDescription>
                </Alert>
                
                <Form {...codeForm}>
                  <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-8">
                    <FormField
                      control={codeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invitation Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your invitation code" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is the code sent to you by your organization administrator.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isSubmittingCode}>
                      {isSubmittingCode ? "Joining..." : "Join Organization"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="email">
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Request Access</AlertTitle>
                  <AlertDescription>
                    If you don't have an invitation code, you can request access using your company email.
                  </AlertDescription>
                </Alert>
                
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-8">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.name@company.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Use your company email to request access to your organization's account.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isSubmittingEmail}>
                      {isSubmittingEmail ? "Sending Request..." : "Request Access"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-center text-sm text-muted-foreground px-6">
              Don't have an organization yet? <Link href="/create-organization" className="underline underline-offset-4 hover:text-primary">Create one</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
} 