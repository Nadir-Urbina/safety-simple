"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  CalendarDays, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity 
} from "lucide-react";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Safety Analytics</h1>

      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Safety Performance Trend
              </h3>
              <div className="h-64 bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">Safety trend chart will appear here</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Form Submissions by Type
              </h3>
              <div className="h-64 bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">Form submissions chart will appear here</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                Form Distribution
              </h3>
              <div className="h-64 bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">Form distribution chart will appear here</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CalendarDays className="mr-2 h-5 w-5" />
                Monthly Form Completion
              </h3>
              <div className="h-64 bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">Monthly completion chart will appear here</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Safety Performance by Department
              </h3>
              <div className="h-64 bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">Safety performance chart will appear here</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                Incident Causes
              </h3>
              <div className="h-64 bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">Incident causes chart will appear here</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 