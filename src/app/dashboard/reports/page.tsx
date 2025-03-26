"use client"

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
  PieChart as PieChartIcon,
  BarChart2,
  TrendingUp,
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

export default function ReportsPage() {
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
  const [activeView, setActiveView] = useState("overview")
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

  const getFormName = (formId: string) => {
    const form = formsList.find((f) => f.id === formId)
    return form ? form.name : "Unknown Form"
  }

  const exportReport = () => {
    try {
      // Create worksheets for different aspects of the report
      const overviewData = [
        {
          "Report Date": format(new Date(), "yyyy-MM-dd"),
          "Date Range": dateRange?.from && dateRange?.to
            ? `${format(dateRange.from, "yyyy-MM-dd")} to ${format(dateRange.to, "yyyy-MM-dd")}`
            : "All Time",
          "Total Submissions": formStats.totalSubmissions,
          "Approved": formStats.approvedSubmissions,
          "Rejected": formStats.rejectedSubmissions,
          "Pending": formStats.pendingSubmissions
        }
      ]
      
      const overviewSheet = XLSX.utils.json_to_sheet(overviewData)
      
      // Submissions by form
      const byFormData = Object.entries(formStats.submissionsByForm).map(([name, count]) => ({
        "Form Type": name,
        "Submissions": count
      }))
      
      const byFormSheet = XLSX.utils.json_to_sheet(byFormData)
      
      // Submissions by date
      const byDateSheet = XLSX.utils.json_to_sheet(formStats.submissionsByDate.map(item => ({
        "Month": item.date,
        "Submissions": item.count
      })))
      
      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, overviewSheet, "Report Overview")
      XLSX.utils.book_append_sheet(wb, byFormSheet, "Submissions by Form")
      XLSX.utils.book_append_sheet(wb, byDateSheet, "Monthly Trend")
      
      // Generate filename
      const dateStr = format(new Date(), "yyyy-MM-dd")
      const fileName = `safety-report-${dateStr}.xlsx`
      
      // Trigger download
      XLSX.writeFile(wb, fileName)
      toast.success("Report exported successfully")
    } catch (error) {
      console.error("Error exporting report:", error)
      toast.error("Failed to export report")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Safety Reports</h1>
        <Button variant="outline" onClick={exportReport}>
          <FileText className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>
              Filter the report data by date range and form type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DateRangePicker 
                value={dateRange} 
                onChange={setDateRange} 
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Form Type</label>
              <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {formsList.map(form => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              Overview of form submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formStats.totalSubmissions}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-sm text-green-700">Approved</p>
                <p className="text-2xl font-bold text-green-700">{formStats.approvedSubmissions}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-sm text-red-700">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{formStats.rejectedSubmissions}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-sm text-amber-700">Pending</p>
                <p className="text-2xl font-bold text-amber-700">{formStats.pendingSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        defaultValue="overview" 
        value={activeView} 
        onValueChange={setActiveView}
        className="mb-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="forms">
            <BarChart2 className="h-4 w-4 mr-2" />
            Forms Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {formStats.statusDistribution.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formStats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {formStats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
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
                <CardTitle>Incident Types</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formStats.incidentsByType}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Submissions Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              {formStats.submissionsByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formStats.submissionsByDate}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Submissions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available for the selected time period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card>
            <CardHeader>
              <CardTitle>Submissions by Form Type</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              {Object.keys(formStats.submissionsByForm).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(formStats.submissionsByForm).map(([name, count]) => ({
                      name,
                      count,
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Submissions" />
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
      </Tabs>
    </div>
  )
} 