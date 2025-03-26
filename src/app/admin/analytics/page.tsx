"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { Download, RefreshCw } from "lucide-react"

// Mock data for charts
const incidentsByTypeData = {
  labels: ["Vehicle Accident", "Injury & Illness", "Environmental Spill"],
  datasets: [
    {
      label: "Incidents",
      data: [29, 9, 8],
      backgroundColor: ["#3b82f6", "#f97316", "#8b5cf6"],
    },
  ],
}

const incidentsByMonthData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [
    {
      label: "Vehicle Accidents",
      data: [3, 2, 4, 1, 5, 2, 3, 2, 1, 2, 1, 3],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      label: "Injuries & Illnesses",
      data: [1, 0, 2, 1, 0, 1, 0, 1, 1, 0, 1, 1],
      borderColor: "#f97316",
      backgroundColor: "rgba(249, 115, 22, 0.1)",
    },
    {
      label: "Environmental Spills",
      data: [0, 1, 0, 2, 1, 0, 1, 0, 1, 1, 0, 1],
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139, 92, 246, 0.1)",
    },
  ],
}

const recognitionByTypeData = {
  labels: ["Hazard Recognition", "Near Miss", "Job Safety Observation", "Good Catch"],
  datasets: [
    {
      label: "Recognition",
      data: [144, 35, 87, 62],
      backgroundColor: ["#1e40af", "#15803d", "#b45309", "#0e7490"],
    },
  ],
}

const heatJSAByMonthData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [
    {
      label: "Heat JSA Submissions",
      data: [5, 8, 15, 25, 35, 45, 50, 42, 30, 20, 10, 5],
      borderColor: "#dc2626",
      backgroundColor: "rgba(220, 38, 38, 0.1)",
    },
  ],
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("year")
  const [isLoading, setIsLoading] = useState(false)

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
          <h1 className="text-2xl font-bold md:text-3xl">Analytics Dashboard</h1>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="incidents">
          <TabsList className="mb-4">
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="recognition">Recognition</TabsTrigger>
            <TabsTrigger value="heat">Heat JSA</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart data={incidentsByTypeData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart data={incidentsByMonthData} />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Incidents by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={{
                      labels: ["Minor", "Moderate", "Major", "Critical"],
                      datasets: [
                        {
                          label: "Vehicle Accidents",
                          data: [12, 8, 6, 3],
                          backgroundColor: "#3b82f6",
                        },
                        {
                          label: "Injuries & Illnesses",
                          data: [4, 3, 1, 1],
                          backgroundColor: "#f97316",
                        },
                        {
                          label: "Environmental Spills",
                          data: [3, 2, 2, 1],
                          backgroundColor: "#8b5cf6",
                        },
                      ],
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recognition" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recognition by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart data={recognitionByTypeData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recognition by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart
                    data={{
                      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                      datasets: [
                        {
                          label: "Hazard Recognition",
                          data: [10, 12, 15, 8, 14, 12, 10, 15, 12, 14, 10, 12],
                          borderColor: "#1e40af",
                          backgroundColor: "rgba(30, 64, 175, 0.1)",
                        },
                        {
                          label: "Near Miss",
                          data: [3, 2, 4, 3, 2, 3, 4, 3, 2, 4, 3, 2],
                          borderColor: "#15803d",
                          backgroundColor: "rgba(21, 128, 61, 0.1)",
                        },
                      ],
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Top Recognized Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={{
                      labels: ["John Smith", "Jane Doe", "Robert Johnson", "Emily Davis", "Michael Brown"],
                      datasets: [
                        {
                          label: "Recognition Count",
                          data: [15, 12, 10, 8, 7],
                          backgroundColor: "#1e40af",
                        },
                      ],
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="heat" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Heat JSA Submissions by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart data={heatJSAByMonthData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Heat Index Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={{
                      labels: [
                        "Low Risk (<80)",
                        "Moderate Risk (80-90)",
                        "High Risk (91-103)",
                        "Very High Risk (104-115)",
                        "Extreme Risk (>115)",
                      ],
                      datasets: [
                        {
                          label: "Heat Index",
                          data: [45, 120, 85, 20, 5],
                          backgroundColor: ["#22c55e", "#eab308", "#f97316", "#dc2626", "#7c3aed"],
                        },
                      ],
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Precautions Taken</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={{
                      labels: [
                        "Provide water",
                        "Provide shade",
                        "Allow breaks",
                        "Buddy system",
                        "Training",
                        "Schedule work",
                        "Rotate workers",
                        "Cooling equipment",
                        "Reduce workload",
                        "Medical services",
                      ],
                      datasets: [
                        {
                          label: "Frequency",
                          data: [275, 260, 245, 220, 200, 180, 165, 120, 100, 80],
                          backgroundColor: "#dc2626",
                        },
                      ],
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Rate by Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={{
                      labels: ["Heat Illness Prevention", "Incident Reporting", "Employee Recognition"],
                      datasets: [
                        {
                          label: "Compliance Rate (%)",
                          data: [92, 85, 78],
                          backgroundColor: ["#22c55e", "#3b82f6", "#8b5cf6"],
                        },
                      ],
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart
                    data={{
                      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                      datasets: [
                        {
                          label: "Overall Compliance (%)",
                          data: [75, 78, 80, 82, 85, 87, 88, 90, 91, 92, 93, 94],
                          borderColor: "#22c55e",
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                        },
                      ],
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

