"use client";

import { useState, useEffect } from "react"
import { useOrganization } from "@/contexts/organization-context"
import { collection, query, getDocs, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { FormSubmission, FormTemplate, SubmissionStatus } from "@/types/forms"
import { format, subMonths, isAfter, parseISO } from "date-fns"
import * as XLSX from 'xlsx'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  FileText,
  Filter,
  RefreshCw,
  Calendar,
  Download,
  PieChart as PieChartIcon,
  BarChart2,
  TrendingUp,
  Activity,
  BarChart3,
  ListFilter,
  ClipboardList
} from "lucide-react"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "../../../components/ui/date-range-picker"

interface FormStats {
  totalSubmissions: number
  approvedSubmissions: number
  rejectedSubmissions: number
  pendingSubmissions: number
  submissionsByForm: { [key: string]: number }
  submissionsByDate: { date: string; count: number }[]
  incidentsByType: { type: string; count: number }[]
  statusDistribution: { name: string; value: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AnalyticsAndReportsPage() {
  const { organization } = useOrganization()
  const [isLoading, setIsLoading] = useState(true)
  const [formsList, setFormsList] = useState<{ id: string; name: string }[]>([])
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [formStats, setFormStats] = useState<FormStats>({
    totalSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    pendingSubmissions: 0,
    submissionsByForm: {},
    submissionsByDate: [],
    incidentsByType: [],
    statusDistribution: [],
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedFormType, setSelectedFormType] = useState<string>("all")

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) return

      try {
        setIsLoading(true)

        // Load form templates
        const formsRef = collection(db, "organizations", organization.id, "formTemplates")
        const formsQuery = query(formsRef)
        const formsSnapshot = await getDocs(formsQuery)

        const forms: { id: string; name: string }[] = []
        formsSnapshot.forEach((doc) => {
          const formData = doc.data()
          forms.push({
            id: doc.id,
            name: formData.name,
          })
        })
        setFormsList(forms)

        // Load submissions
        const submissionsRef = collection(db, "organizations", organization.id, "formSubmissions")
        const submissionsQuery = query(
          submissionsRef,
          orderBy("submittedAt", "desc"),
          limit(500) // Load more for reporting
        )
        const submissionsSnapshot = await getDocs(submissionsQuery)

        const submissionsList: FormSubmission[] = []
        submissionsSnapshot.forEach((doc) => {
          const submissionData = doc.data() as FormSubmission
          submissionsList.push({
            ...submissionData,
            id: doc.id,
            submittedAt: submissionData.submittedAt?.toDate() || new Date(),
          })
        })

        setSubmissions(submissionsList)
        calculateStats(submissionsList, forms, dateRange)
      } catch (error) {
        console.error("Error loading report data:", error)
        toast.error("Failed to load report data")
      } finally {
        setIsLoading(false)
      }
    }

    if (organization?.id) {
      loadData()
    }
  }, [organization?.id])

  // Recalculate stats when filters change
  useEffect(() => {
    if (submissions.length > 0) {
      calculateStats(submissions, formsList, dateRange)
    }
  }, [dateRange, selectedFormType])

  const calculateStats = (
    submissionData: FormSubmission[],
    forms: { id: string; name: string }[],
    dateFilter?: DateRange
  ) => {
    // Filter by date range if provided
    let filteredSubmissions = submissionData
    if (dateFilter?.from) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => isAfter(sub.submittedAt, dateFilter.from!)
      )
    }
    if (dateFilter?.to) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => !isAfter(sub.submittedAt, new Date(dateFilter.to!.setHours(23, 59, 59)))
      )
    }

    // Filter by form type if not "all"
    if (selectedFormType !== "all") {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.formTemplateId === selectedFormType
      )
    }

    // Count by status
    const approved = filteredSubmissions.filter((sub) => sub.status === "approved").length
    const rejected = filteredSubmissions.filter((sub) => sub.status === "rejected").length
    const pending = filteredSubmissions.filter(
      (sub) => sub.status === "submitted" || sub.status === "inReview"
    ).length

    // Count by form
    const byForm: { [key: string]: number } = {}
    forms.forEach((form) => {
      byForm[form.name] = filteredSubmissions.filter(
        (sub) => sub.formTemplateId === form.id
      ).length
    })

    // Group by date (month)
    const byDate = new Map<string, number>()
    filteredSubmissions.forEach((sub) => {
      const dateKey = format(sub.submittedAt, "MMM yyyy")
      byDate.set(dateKey, (byDate.get(dateKey) || 0) + 1)
    })
    const submissionsByDate = Array.from(byDate.entries()).map(([date, count]) => ({
      date,
      count,
    }))
    submissionsByDate.sort((a, b) => {
      // Parse the month names to dates for proper sorting
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })

    // Mock data for incident types
    // In a real app, you'd extract this from actual form values
    const incidentsByType = [
      { type: "Slip/Trip/Fall", count: Math.floor(Math.random() * 10) + 5 },
      { type: "Equipment Failure", count: Math.floor(Math.random() * 8) + 3 },
      { type: "Electrical", count: Math.floor(Math.random() * 6) + 2 },
      { type: "Chemical Spill", count: Math.floor(Math.random() * 5) + 1 },
      { type: "Other", count: Math.floor(Math.random() * 7) + 4 },
    ]

    // Status distribution for pie chart
    const statusDistribution = [
      { name: "Approved", value: approved },
      { name: "Rejected", value: rejected },
      { name: "Pending Review", value: pending },
    ]

    setFormStats({
      totalSubmissions: filteredSubmissions.length,
      approvedSubmissions: approved,
      rejectedSubmissions: rejected,
      pendingSubmissions: pending,
      submissionsByForm: byForm,
      submissionsByDate: submissionsByDate,
      incidentsByType,
      statusDistribution,
    })
  }

  // Export report to Excel
  const exportToExcel = () => {
    try {
      // Create a workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Overview sheet
      const overviewData = [
        ["Report Period", dateRange?.from ? format(dateRange.from, "MM/dd/yyyy") : "All", "to", dateRange?.to ? format(dateRange.to, "MM/dd/yyyy") : "Present"],
        ["Total Submissions", formStats.totalSubmissions],
        ["Approved Submissions", formStats.approvedSubmissions],
        ["Rejected Submissions", formStats.rejectedSubmissions],
        ["Pending Submissions", formStats.pendingSubmissions],
      ];
      
      const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWs, "Overview");
      
      // Submissions by form
      const formData = [["Form Name", "Submission Count"]];
      Object.entries(formStats.submissionsByForm).forEach(([form, count]) => {
        formData.push([form, count]);
      });
      
      const formWs = XLSX.utils.aoa_to_sheet(formData);
      XLSX.utils.book_append_sheet(wb, formWs, "By Form");
      
      // Submissions by date
      const dateData = [["Month", "Submission Count"]];
      formStats.submissionsByDate.forEach(item => {
        dateData.push([item.date, item.count]);
      });
      
      const dateWs = XLSX.utils.aoa_to_sheet(dateData);
      XLSX.utils.book_append_sheet(wb, dateWs, "By Month");
      
      // Export the workbook
      XLSX.writeFile(wb, `Safety_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Analyze safety data and generate reports
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          
          <Select value={selectedFormType} onValueChange={setSelectedFormType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Form Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {formsList.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-3xl font-bold">{formStats.totalSubmissions}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold">{formStats.approvedSubmissions}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold">{formStats.pendingSubmissions}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-amber-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold">{formStats.rejectedSubmissions}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different views */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="forms">
            <FileText className="h-4 w-4 mr-2" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="safety">
            <ClipboardList className="h-4 w-4 mr-2" />
            Safety
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Status Distribution</CardTitle>
                <CardDescription>Breakdown of form submissions by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {formStats.statusDistribution.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formStats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formStats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Submissions Over Time</CardTitle>
                <CardDescription>Monthly form submission trends</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {formStats.submissionsByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formStats.submissionsByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Submissions"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Safety Trends Over Time</CardTitle>
              <CardDescription>
                Tracking form submissions and incident reports
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {formStats.submissionsByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formStats.submissionsByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Submissions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Usage Distribution</CardTitle>
                <CardDescription>
                  Breakdown of submissions by form type
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {Object.keys(formStats.submissionsByForm).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(formStats.submissionsByForm).map(([name, value]) => ({
                          name,
                          value,
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.keys(formStats.submissionsByForm).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Form Submission Comparison</CardTitle>
                <CardDescription>
                  Comparing usage across different form types
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {Object.keys(formStats.submissionsByForm).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(formStats.submissionsByForm).map(([name, value]) => ({
                        name,
                        count: value,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Submissions" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Safety Tab */}
        <TabsContent value="safety" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incidents by Type</CardTitle>
                <CardDescription>Distribution of incidents by category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {formStats.incidentsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formStats.incidentsByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Incidents" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No incident data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Safety Performance</CardTitle>
                <CardDescription>Metrics related to safety records</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Safety metrics will be displayed here. Connect with your safety system to view metrics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 