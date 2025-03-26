"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Car, Thermometer, AlertTriangle, Droplets, ThumbsUp, RefreshCw, Download } from "lucide-react"

interface ReportSummary {
  type: string
  count: number
  color: string
  icon: React.ReactNode
}

interface ReportData {
  id: string
  name: string
  date: string
  type: string
  severity: "Minor" | "Major" | "Critical"
  description: string
  status: "New" | "In Progress" | "Resolved"
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<ReportData[]>([])

  useEffect(() => {
    // In a real app, this would fetch data from Firebase
    const fetchData = async () => {
      setIsLoading(true)

      // Simulate API call
      setTimeout(() => {
        const mockReports: ReportData[] = [
          {
            id: "1",
            name: "David Allen Cook Jr",
            date: "March 12, 2025",
            type: "Unsafe Condition",
            severity: "Major",
            description: "Belt guard on RAP weight belt has large holes",
            status: "New",
          },
          {
            id: "2",
            name: "Royse Edward Vaughn III",
            date: "March 12, 2025",
            type: "Unsafe Condition",
            severity: "Minor",
            description: "Gas tank signs were not visible",
            status: "New",
          },
          {
            id: "3",
            name: "Rachel Rodriguez",
            date: "March 12, 2025",
            type: "Unsafe Behavior",
            severity: "Major",
            description: "Tach truck #92220 was driving through the plant on the phone",
            status: "New",
          },
          {
            id: "4",
            name: "Terry Terrell Smith",
            date: "March 11, 2025",
            type: "PIT/Equipment",
            severity: "Major",
            description: "On the horizontal tank, the cover was left off after inspection",
            status: "New",
          },
          {
            id: "5",
            name: "David Franklin McGalliard Jr",
            date: "March 11, 2025",
            type: "PIT/Equipment",
            severity: "Minor",
            description: "Propane tank area needs better signage",
            status: "New",
          },
        ]

        setReports(mockReports)
        setIsLoading(false)
      }, 1000)
    }

    fetchData()
  }, [])

  const reportSummaries: ReportSummary[] = [
    {
      type: "Vehicle Accident",
      count: 29,
      color: "bg-blue-600",
      icon: <Car className="h-6 w-6" />,
    },
    {
      type: "Injury & Illness",
      count: 9,
      color: "bg-orange-500",
      icon: <AlertTriangle className="h-6 w-6" />,
    },
    {
      type: "Near Miss",
      count: 35,
      color: "bg-green-600",
      icon: <ThumbsUp className="h-6 w-6" />,
    },
    {
      type: "Env. Spills",
      count: 8,
      color: "bg-purple-600",
      icon: <Droplets className="h-6 w-6" />,
    },
    {
      type: "Hazard Recognition",
      count: 144,
      color: "bg-indigo-800",
      icon: <AlertTriangle className="h-6 w-6" />,
    },
    {
      type: "Heat JSA",
      count: 275,
      color: "bg-red-600",
      icon: <Thermometer className="h-6 w-6" />,
    },
  ]

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Minor":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Minor
          </Badge>
        )
      case "Major":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            Major
          </Badge>
        )
      case "Critical":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Critical
          </Badge>
        )
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <Badge className="bg-blue-500">New</Badge>
      case "In Progress":
        return <Badge className="bg-amber-500">In Progress</Badge>
      case "Resolved":
        return <Badge className="bg-green-500">Resolved</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)

    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleExport = () => {
    // In a real app, this would generate a CSV or Excel file
    alert("Exporting data...")
  }

  return (
    <MainLayout>
      <div className="container p-4 md:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold md:text-3xl">EHS Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Total Reports to Date</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {reportSummaries.map((report, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className={`${report.color} p-4 text-white`}>
                  <CardTitle className="flex items-center justify-center text-lg">
                    {report.icon}
                    <span className="ml-2">{report.type}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{report.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Latest Reports</h2>
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-4">
                  <TabsList className="mt-2">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="vehicle">Vehicle Accident</TabsTrigger>
                    <TabsTrigger value="injury">Injury & Illness</TabsTrigger>
                    <TabsTrigger value="near-miss">Near Miss</TabsTrigger>
                    <TabsTrigger value="spills">Env. Spills</TabsTrigger>
                    <TabsTrigger value="hazard">Hazard Recognition</TabsTrigger>
                    <TabsTrigger value="heat">Heat JSA</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead className="w-[300px]">Description</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              <div className="flex items-center justify-center">
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : reports.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No reports found
                            </TableCell>
                          </TableRow>
                        ) : (
                          reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">{report.name}</TableCell>
                              <TableCell>{report.date}</TableCell>
                              <TableCell>{report.type}</TableCell>
                              <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                              <TableCell className="max-w-[300px] truncate">{report.description}</TableCell>
                              <TableCell>{getStatusBadge(report.status)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Other tab contents would be similar but filtered by type */}
                <TabsContent value="vehicle" className="p-0">
                  {/* Vehicle accident reports */}
                </TabsContent>
                <TabsContent value="injury" className="p-0">
                  {/* Injury & Illness reports */}
                </TabsContent>
                <TabsContent value="near-miss" className="p-0">
                  {/* Near Miss reports */}
                </TabsContent>
                <TabsContent value="spills" className="p-0">
                  {/* Environmental Spills reports */}
                </TabsContent>
                <TabsContent value="hazard" className="p-0">
                  {/* Hazard Recognition reports */}
                </TabsContent>
                <TabsContent value="heat" className="p-0">
                  {/* Heat JSA reports */}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

