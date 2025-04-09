"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { collection, query, getDocs, where, limit, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { FormTemplate, FormSubmission } from "@/src/types/forms"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  FileText, 
  ClipboardList, 
  Inbox, 
  FilePlus, 
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { toDate } from '@/lib/firebase-utils'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalForms: 0,
    activeForms: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    recentForms: [] as FormTemplate[],
    recentSubmissions: [] as FormSubmission[]
  })
  
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!organization?.id) return
      
      try {
        setIsLoading(true)
        
        // Query forms
        const formsRef = collection(db, "organizations", organization.id, "formTemplates")
        const formsQuery = query(formsRef, orderBy("updatedAt", "desc"), limit(5))
        const formsSnapshot = await getDocs(formsQuery)
        
        // Count active forms
        const formsCount = formsSnapshot.size
        const activeForms = formsSnapshot.docs.filter(doc => doc.data().isActive).length
        
        // Get recent forms
        const recentForms: FormTemplate[] = []
        formsSnapshot.forEach(doc => {
          const data = doc.data() as FormTemplate
          recentForms.push({
            ...data,
            createdAt: toDate(data.createdAt) || new Date(),
            updatedAt: toDate(data.updatedAt) || new Date(),
          })
        })
        
        // Query submissions
        const submissionsRef = collection(db, "organizations", organization.id, "formSubmissions")
        const submissionsQuery = query(submissionsRef, orderBy("submittedAt", "desc"), limit(5))
        const submissionsSnapshot = await getDocs(submissionsQuery)
        
        // Count pending submissions
        const pendingQuery = query(
          submissionsRef, 
          where("status", "in", ["submitted", "inReview"]),
          limit(1000)
        )
        const pendingSnapshot = await getDocs(pendingQuery)
        
        // Get recent submissions
        const recentSubmissions: FormSubmission[] = []
        submissionsSnapshot.forEach(doc => {
          const data = doc.data() as FormSubmission
          recentSubmissions.push({
            ...data,
            submittedAt: toDate(data.submittedAt) || new Date(),
          })
        })
        
        setStats({
          totalForms: formsCount,
          activeForms,
          totalSubmissions: submissionsSnapshot.size,
          pendingSubmissions: pendingSnapshot.size,
          recentForms,
          recentSubmissions
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (organization?.id) {
      loadDashboardData()
    }
  }, [organization?.id])
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="default">Submitted</Badge>
      case "inReview":
        return <Badge variant="secondary">In Review</Badge>
      case "approved":
        return <Badge variant="success">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Get category badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "incident":
        return <Badge variant="destructive">Incident Report</Badge>
      case "recognition":
        return <Badge variant="success">Recognition</Badge>
      case "heatPrevention":
        return <Badge variant="warning">Heat Prevention</Badge>
      case "other":
      default:
        return <Badge variant="secondary">Other</Badge>
    }
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {user?.role === "admin" && (
          <Button onClick={() => router.push("/dashboard/forms/builder")}>
            <FilePlus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeForms} active forms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Form Submissions</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingSubmissions} pending review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Collection</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Self-Service</div>
            <p className="text-xs text-muted-foreground">
              Create and manage custom forms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground">
              Safety program is up to date
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Forms Overview</CardTitle>
                <CardDescription>
                  Your organization's form collection
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded bg-primary" />
                    <span>Active Forms</span>
                  </div>
                  <div>{stats.activeForms}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded bg-muted" />
                    <span>Inactive Forms</span>
                  </div>
                  <div>{stats.totalForms - stats.activeForms}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded bg-green-500" />
                    <span>Approved Submissions</span>
                  </div>
                  <div>{stats.totalSubmissions - stats.pendingSubmissions}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded bg-amber-500" />
                    <span>Pending Submissions</span>
                  </div>
                  <div>{stats.pendingSubmissions}</div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/analytics">
                  <Button variant="ghost" className="w-full">
                    <BarChart className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your safety program
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link href="/dashboard/forms/builder">
                  <Button variant="outline" className="w-full justify-start">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Create New Form
                  </Button>
                </Link>
                <Link href="/dashboard/forms">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Forms
                  </Button>
                </Link>
                <Link href="/dashboard/forms/submissions">
                  <Button variant="outline" className="w-full justify-start">
                    <Inbox className="mr-2 h-4 w-4" />
                    Review Submissions
                  </Button>
                </Link>
                <Link href="/dashboard/reports">
                  <Button variant="outline" className="w-full justify-start">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Generate Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Forms</CardTitle>
              <CardDescription>
                Your most recently created or updated forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentForms.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No forms yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push("/dashboard/forms/builder")}
                  >
                    <FilePlus className="mr-2 h-4 w-4" />
                    Create Your First Form
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentForms.map((form) => (
                    <div 
                      key={form.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-medium flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          {form.name}
                          {form.isActive ? (
                            <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                          ) : (
                            <span className="ml-2 h-2 w-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Updated {format(form.updatedAt, "MMM d, yyyy")}
                          </span>
                          {getCategoryBadge(form.category)}
                        </div>
                      </div>
                      <Link href={`/dashboard/forms/builder?id=${form.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/forms">
                <Button variant="ghost" className="w-full">
                  View All Forms
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                Latest form submissions that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentSubmissions.length === 0 ? (
                <div className="text-center py-6">
                  <Inbox className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentSubmissions.map((submission) => {
                    const formName = stats.recentForms.find(f => f.id === submission.formTemplateId)?.name || "Unknown Form"
                    return (
                      <div 
                        key={submission.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="font-medium flex items-center">
                            {submission.status === "submitted" && (
                              <Clock className="h-4 w-4 mr-2 text-amber-500" />
                            )}
                            {submission.status === "inReview" && (
                              <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            )}
                            {submission.status === "approved" && (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            )}
                            {submission.status === "rejected" && (
                              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                            )}
                            {formName}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Submitted {format(submission.submittedAt, "MMM d, yyyy")}
                            </span>
                            {getStatusBadge(submission.status)}
                          </div>
                        </div>
                        <Link href={`/dashboard/forms/submissions?formId=${submission.formTemplateId}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/forms/submissions">
                <Button variant="ghost" className="w-full">
                  View All Submissions
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 