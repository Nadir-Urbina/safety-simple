"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { OrganizationSettings } from "./components/organization-settings";
import { NotificationSettings } from "./components/notification-settings";
import { ComplianceSettings } from "./components/compliance-settings";
import { DataManagement } from "./components/data-management";
import { HeatPreventionSettings } from "./components/heat-prevention-settings";
import {
  LayoutGrid,
  Bell,
  Shield,
  Database,
  Users,
  Settings2,
  Thermometer,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      <Tabs
        defaultValue="organization"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="bg-background sticky top-0 z-10 w-full py-2">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger
              value="organization"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Organization</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="compliance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              <span>Compliance</span>
            </TabsTrigger>
            <TabsTrigger
              value="heat-prevention"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Thermometer className="h-4 w-4" />
              <span>Heat Prevention</span>
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              <span>Data Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span>Team</span>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Settings2 className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="organization" className="space-y-4">
          <Card className="p-6">
            <OrganizationSettings />
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <NotificationSettings />
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="p-6">
            <ComplianceSettings />
          </Card>
        </TabsContent>

        <TabsContent value="heat-prevention" className="space-y-4">
          <Card className="p-6">
            <HeatPreventionSettings />
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card className="p-6">
            <DataManagement />
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h3 className="text-2xl font-bold">Team Management</h3>
                <p className="text-muted-foreground">
                  Manage your team members and their access levels
                </p>
              </div>
              
              <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Bell className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Coming Soon</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Team management features will be available in an upcoming update.
                        This will include user roles, permissions, and onboarding workflows.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h3 className="text-2xl font-bold">Advanced Settings</h3>
                <p className="text-muted-foreground">
                  Configure advanced system settings and integrations
                </p>
              </div>
              
              <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Bell className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Coming Soon</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Advanced settings and integration options will be available in a future update.
                        This will include API access, webhooks, and custom integrations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 