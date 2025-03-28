"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast, toast as showToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotificationSettings } from "../../../../hooks/use-notification-settings";
import { NotificationSettings as NotificationSettingsType } from "@/types";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";

// Email notifications schema
const emailSchema = z.object({
  enabled: z.boolean(),
  criticalIncidents: z.boolean(),
  newFormSubmissions: z.boolean(),
  submissionApprovals: z.boolean(),
  systemUpdates: z.boolean(),
  dailyDigest: z.boolean(),
});

// SMS alerts schema
const smsSchema = z.object({
  enabled: z.boolean(),
  criticalIncidents: z.boolean(),
  submissionApprovals: z.boolean(),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, {
    message: "Please enter a valid phone number",
  }).optional().or(z.literal('')),
});

// Report scheduling schema
const reportSchema = z.object({
  enabled: z.boolean(),
  dailyDigest: z.boolean(),
  weeklyDigest: z.boolean(),
  monthlyReport: z.boolean(),
  scheduleTime: z.string(),
  scheduleDay: z.enum([
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ]),
  recipients: z.string().refine(value => {
    if (!value) return true;
    const emails = value.split(',').map(email => email.trim());
    return emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, {
    message: "Please enter valid email addresses separated by commas",
  }).optional().or(z.literal('')),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type SMSFormValues = z.infer<typeof smsSchema>;
type ReportFormValues = z.infer<typeof reportSchema>;

const defaultNotificationSettings: NotificationSettingsType = {
  email: {
    enabled: true,
    criticalIncidents: true,
    newFormSubmissions: true,
    submissionApprovals: true,
    systemUpdates: false,
    dailyDigest: false,
  },
  sms: {
    enabled: false,
    criticalIncidents: true,
    submissionApprovals: false,
    phoneNumber: "",
  },
  reports: {
    enabled: false,
    dailyDigest: false,
    weeklyDigest: true,
    monthlyReport: false,
    scheduleTime: "09:00",
    scheduleDay: "monday",
    recipients: "",
  },
};

export function NotificationSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("email");
  
  const { 
    settings,
    loading,
    saving,
    updateEmailSettings,
    updateSmsSettings,
    updateReportSettings
  } = useNotificationSettings(defaultNotificationSettings);
  
  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: settings?.email || defaultNotificationSettings.email
  });

  // SMS form
  const smsForm = useForm<SMSFormValues>({
    resolver: zodResolver(smsSchema),
    defaultValues: settings?.sms || defaultNotificationSettings.sms
  });

  // Report scheduling form
  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: settings?.reports || defaultNotificationSettings.reports
  });

  // Update form values when settings load
  useEffect(() => {
    if (!loading && settings) {
      emailForm.reset(settings.email);
      smsForm.reset(settings.sms);
      reportForm.reset(settings.reports);
    }
  }, [settings, loading, emailForm, smsForm, reportForm]);

  const handleEmailSubmit = async (data: EmailFormValues) => {
    console.log("Submitting email settings:", data);
    try {
      await updateEmailSettings(data);
      showToast({
        title: "Email settings saved",
        description: "Your email notification settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving email settings:", error);
      showToast({
        title: "Error saving settings",
        description: "There was a problem saving your email settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSMSSubmit = async (data: SMSFormValues) => {
    console.log("Submitting SMS settings:", data);
    try {
      await updateSmsSettings(data);
      showToast({
        title: "SMS settings saved",
        description: "Your SMS notification settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving SMS settings:", error);
      showToast({
        title: "Error saving settings",
        description: "There was a problem saving your SMS settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReportSubmit = async (data: ReportFormValues) => {
    console.log("Submitting report settings:", data);
    try {
      await updateReportSettings(data);
      showToast({
        title: "Report settings saved",
        description: "Your report scheduling settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving report settings:", error);
      showToast({
        title: "Error saving settings",
        description: "There was a problem saving your report settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const { user } = useAuth();
  const { organization } = useOrganization();

  const handleSendTestEmail = async () => {
    if (!user?.email) {
      showToast({
        title: "Error",
        description: "Unable to send test email. Please ensure you are logged in.",
        variant: "destructive",
      });
      return;
    }

    if (!organization?.id) {
      showToast({
        title: "Error",
        description: "Organization information not found. Please reload the page and try again.",
        variant: "destructive",
      });
      return;
    }

    showToast({
      title: "Sending test email",
      description: "Please wait while we send a test email to your address...",
    });

    try {
      // First try the basic hello endpoint
      console.log("Trying basic API test...");
      
      try {
        const helloResponse = await fetch('/api/hello');
        if (helloResponse.ok) {
          const helloResult = await helloResponse.json();
          console.log("Basic API test success:", helloResult);
        } else {
          console.error("Basic API test failed:", helloResponse.status);
        }
      } catch (e) {
        console.error("Error testing basic API:", e);
      }
      
      // Now try the new email-test endpoint
      console.log("Sending test email with organization ID:", organization.id);
      console.log("Using email-test endpoint...");
      
      const response = await fetch('/api/notifications/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email: user.email,
          organizationId: organization.id
        }),
      });

      if (!response.ok) {
        // Handle non-2xx responses
        const errorText = await response.text();
        console.error("Server responded with error:", response.status, errorText);
        
        let errorMessage = "Failed to send test email";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If can't parse JSON, use the status code
          errorMessage = `Server error: ${response.status}`;
        }
        
        showToast({
          title: "Error sending email",
          description: errorMessage,
          variant: "destructive",
        });
        
        return;
      }

      const result = await response.json();
      console.log("Email test response:", result);
      
      if (result.success) {
        showToast({
          title: "Test email sent",
          description: `An email has been sent to ${user.email}. Please check your inbox.`,
        });
      } else {
        throw new Error(result.error || "Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      showToast({
        title: "Error sending email",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSendTestSMS = async () => {
    if (!organization?.id) {
      showToast({
        title: "Error",
        description: "Organization information not found. Please reload the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    const phoneNumber = smsForm.getValues("phoneNumber");
    if (!phoneNumber || phoneNumber.trim() === '') {
      showToast({
        title: "Error",
        description: "Please enter a valid phone number to send a test SMS.",
        variant: "destructive",
      });
      return;
    }

    showToast({
      title: "Sending test SMS",
      description: "Please wait while we send a test SMS to your phone...",
    });

    try {
      console.log("Sending test SMS to:", phoneNumber);
      console.log("Using test-simple endpoint to diagnose routing issues");
      
      const response = await fetch('/api/notifications/test-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sms',
          phoneNumber,
          organizationId: organization.id
        }),
      });

      if (!response.ok) {
        // Handle non-2xx responses
        const errorText = await response.text();
        console.error("Server responded with error:", response.status, errorText);
        
        let errorMessage = "Failed to send test SMS";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If can't parse JSON, use the status code
          errorMessage = `Server error: ${response.status}`;
        }
        
        showToast({
          title: "Error sending SMS",
          description: errorMessage,
          variant: "destructive",
        });
        
        return;
      }

      const result = await response.json();
      console.log("Test endpoint response:", result);
      
      if (result.success) {
        showToast({
          title: "Test endpoint working",
          description: `API routing is working. This is a diagnostic test, not an actual SMS send.`,
        });
      } else {
        throw new Error(result.error || "Failed to send test SMS");
      }
    } catch (error) {
      console.error("Error sending test SMS:", error);
      showToast({
        title: "Error sending SMS",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const testBasicApi = async () => {
    showToast({
      title: "Testing API",
      description: "Testing basic API endpoint...",
    });
    
    try {
      console.log("Testing basic /api/hello endpoint...");
      const response = await fetch('/api/hello');
      
      if (!response.ok) {
        throw new Error(`API test failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Basic API test result:", result);
      
      showToast({
        title: "API test successful",
        description: `Response: ${JSON.stringify(result)}`,
      });
    } catch (error) {
      console.error("Error testing API:", error);
      showToast({
        title: "API test failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="email">Email Notifications</TabsTrigger>
        <TabsTrigger value="sms">SMS Alerts</TabsTrigger>
        <TabsTrigger value="reports">Report Scheduling</TabsTrigger>
      </TabsList>
      
      <TabsContent value="email">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Configure which email notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={(e) => {
                console.log("Email form submitted");
                emailForm.handleSubmit(handleEmailSubmit)(e);
              }} className="space-y-6">
                <FormField
                  control={emailForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                        <FormDescription>
                          Master toggle for all email notifications
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Types</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="newFormSubmissions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">New Form Submissions</FormLabel>
                            <FormDescription className="text-xs">
                              Receive notifications when new forms are submitted
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!emailForm.watch('enabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="submissionApprovals"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Submission Approvals</FormLabel>
                            <FormDescription className="text-xs">
                              Receive notifications for submission approvals/rejections
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!emailForm.watch('enabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="criticalIncidents"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Critical Incidents</FormLabel>
                            <FormDescription className="text-xs">
                              Receive immediate notification for high-priority safety issues
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!emailForm.watch('enabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="systemUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">System Updates</FormLabel>
                            <FormDescription className="text-xs">
                              Receive notifications about system updates and maintenance
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!emailForm.watch('enabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={emailForm.control}
                    name="dailyDigest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Daily Digest</FormLabel>
                          <FormDescription className="text-xs">
                            Receive a daily summary of all activity
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!emailForm.watch('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-between">
                  <div className="space-x-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSendTestEmail}
                    >
                      Send Test Email
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="secondary"
                      onClick={testBasicApi}
                    >
                      Test API
                    </Button>
                  </div>
                  
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save email settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="sms">
        <Card>
          <CardHeader>
            <CardTitle>SMS Alerts</CardTitle>
            <CardDescription>
              Configure SMS alerts for high-priority notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...smsForm}>
              <form onSubmit={(e) => {
                console.log("SMS form submitted");
                smsForm.handleSubmit(handleSMSSubmit)(e);
              }} className="space-y-6">
                <FormField
                  control={smsForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">Enable SMS Alerts</FormLabel>
                        <FormDescription>
                          Master toggle for SMS notifications (carrier rates may apply)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={smsForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormDescription>
                        Enter your mobile number to receive SMS alerts
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="+1234567890"
                          {...field}
                          disabled={!smsForm.watch('enabled')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">SMS Alert Types</h3>
                  
                  <FormField
                    control={smsForm.control}
                    name="criticalIncidents"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Critical Incidents</FormLabel>
                          <FormDescription className="text-xs">
                            Receive SMS alerts for critical safety incidents
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!smsForm.watch('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={smsForm.control}
                    name="submissionApprovals"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Approval Requests</FormLabel>
                          <FormDescription className="text-xs">
                            Receive SMS alerts when your approval is needed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!smsForm.watch('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleSendTestSMS}
                    disabled={!smsForm.watch('enabled') || !smsForm.watch('phoneNumber')}
                  >
                    Send Test SMS
                  </Button>
                  
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save SMS settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Report Scheduling</CardTitle>
            <CardDescription>
              Configure automated report delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...reportForm}>
              <form onSubmit={(e) => {
                console.log("Report form submitted");
                reportForm.handleSubmit(handleReportSubmit)(e);
              }} className="space-y-6">
                <FormField
                  control={reportForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">Enable Report Scheduling</FormLabel>
                        <FormDescription>
                          Master toggle for scheduled report delivery
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Report Types</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={reportForm.control}
                      name="dailyDigest"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Daily Digest</FormLabel>
                            <FormDescription className="text-xs">
                              Daily summary of all activities
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!reportForm.watch('enabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={reportForm.control}
                      name="weeklyDigest"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Weekly Digest</FormLabel>
                            <FormDescription className="text-xs">
                              Weekly summary of all activities
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!reportForm.watch('enabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={reportForm.control}
                    name="monthlyReport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Monthly Report</FormLabel>
                          <FormDescription className="text-xs">
                            Comprehensive monthly report with statistics
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!reportForm.watch('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={reportForm.control}
                    name="scheduleDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Day</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!reportForm.watch('enabled')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Day of the week to deliver weekly reports
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={reportForm.control}
                    name="scheduleTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!reportForm.watch('enabled')}
                          />
                        </FormControl>
                        <FormDescription>
                          Time of day for report delivery (in your local timezone)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={reportForm.control}
                  name="recipients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Recipients</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email1@example.com, email2@example.com"
                          {...field}
                          disabled={!reportForm.watch('enabled')}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional email addresses to receive reports (comma-separated)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save report settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 