"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, MapPin, Upload } from "lucide-react";
import { useGeneralSettings, useWorkingHoursSettings, useBrandingSettings } from "../../../../hooks/use-organization-settings";
import { useOrganization } from "@/contexts/organization-context";
import { GeneralSettings, WorkingHoursSettings, BrandingSettings } from "@/lib/settings";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const organizationSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  industry: z.string({
    required_error: "Please select an industry.",
  }),
  size: z.string({
    required_error: "Please select a company size.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  zipCode: z.string().min(5, {
    message: "Zip code must be at least 5 characters.",
  }),
  country: z.string().min(2, {
    message: "Country must be at least 2 characters.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  website: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal('')),
  description: z.string().max(500).optional(),
});

const workingHoursSchema = z.object({
  workDays: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),
  }),
  workHoursStart: z.string(),
  workHoursEnd: z.string(),
  timezone: z.string(),
  enableAfterHoursAlerts: z.boolean(),
});

type OrganizationValues = z.infer<typeof organizationSchema>;
type WorkingHoursValues = z.infer<typeof workingHoursSchema>;

const defaultGeneralSettings: OrganizationValues = {
  name: "",
  industry: "construction",
  size: "51-200",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "United States",
  phone: "",
  website: "",
  description: "",
};

const defaultWorkingHoursSettings: WorkingHoursValues = {
  workDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  workHoursStart: "09:00",
  workHoursEnd: "17:00",
  timezone: "America/New_York",
  enableAfterHoursAlerts: true,
};

const defaultBrandingSettings = {
  logoURL: "/placeholder-logo.png",
  primaryColor: "#2563EB",
  secondaryColor: "#1F2937",
  accentColor: "#10B981",
};

export function OrganizationSettings() {
  const { toast } = useToast();
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState("general");
  
  // Organization general settings
  const { 
    settings: generalSettings, 
    loading: generalLoading, 
    saving: generalSaving, 
    updateSettings: updateGeneralSettings 
  } = useGeneralSettings({
    ...defaultGeneralSettings,
    // If organization name is available from context, use it
    name: organization?.name || defaultGeneralSettings.name
  });
  
  // Working hours settings
  const { 
    settings: hoursSettings, 
    loading: hoursLoading, 
    saving: hoursSaving, 
    updateSettings: updateHoursSettings 
  } = useWorkingHoursSettings(defaultWorkingHoursSettings);
  
  // Branding settings
  const { 
    settings: brandingSettings, 
    loading: brandingLoading, 
    saving: brandingSaving, 
    updateSettings: updateBrandingSettings 
  } = useBrandingSettings(defaultBrandingSettings);
  
  // Organization General form
  const generalForm = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: generalSettings
  });

  // Update form values when settings load
  useEffect(() => {
    if (!generalLoading) {
      generalForm.reset(generalSettings);
    }
  }, [generalSettings, generalLoading]);

  // Working Hours form
  const hoursForm = useForm<WorkingHoursValues>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: hoursSettings
  });

  // Update form values when settings load
  useEffect(() => {
    if (!hoursLoading) {
      hoursForm.reset(hoursSettings);
    }
  }, [hoursSettings, hoursLoading]);

  const onSubmitGeneral = async (data: OrganizationValues) => {
    try {
      await updateGeneralSettings(data);
      
      // If name was updated, also update the main organization record
      if (organization && data.name !== organization.name) {
        try {
          // Update organization name in the main organization document
          await updateOrganization({ name: data.name });
        } catch (error) {
          console.error("Error updating organization name:", error);
          // Use direct toast function
          showToast({
            title: "Partial update",
            description: "Settings were saved but organization name wasn't updated in all places.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Use direct toast function for immediate visibility
      showToast({
        title: "Organization settings saved",
        description: "Your organization settings have been updated successfully.",
      });
      
      // Also use the hook-based toast as a backup
      toast({
        title: "Organization settings saved",
        description: "Your organization settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving organization settings:", error);
      // Use direct toast function
      showToast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmitHours = async (data: WorkingHoursValues) => {
    try {
      await updateHoursSettings(data);
      
      // Use direct toast function for immediate visibility
      showToast({
        title: "Working hours saved",
        description: "Your working hours settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving working hours:", error);
      showToast({
        title: "Error saving settings",
        description: "There was a problem saving your working hours. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileType = file.type;
    
    // Validate file type
    if (!fileType.startsWith('image/')) {
      console.log("Showing toast for invalid file type");
      showToast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Showing toast for uploading logo");
      showToast({
        title: "Uploading logo",
        description: "Please wait while we upload your logo...",
      });
      
      const storage = getStorage();
      const orgId = organization?.id;
      
      if (!orgId) {
        throw new Error("Organization ID not found");
      }
      
      // Create a storage reference
      const storageRef = ref(storage, `organizations/${orgId}/logo`);
      
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update branding settings with new logo URL
      await updateBrandingSettings({
        ...brandingSettings,
        logoURL: downloadURL
      });
      
      console.log("Showing toast for successful logo upload");
      showToast({
        title: "Logo uploaded successfully",
        description: "Your organization logo has been updated.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      console.log("Showing toast for upload failure");
      showToast({
        title: "Upload failed",
        description: "There was a problem uploading your logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>General Info</span>
        </TabsTrigger>
        <TabsTrigger value="hours" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Working Hours</span>
        </TabsTrigger>
        <TabsTrigger value="branding" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Branding</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
              Update your organization's general information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generalLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <Form {...generalForm}>
                <form 
                  onSubmit={(e) => {
                    console.log("Form submitted");
                    generalForm.handleSubmit(onSubmitGeneral)(e);
                  }} 
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Organization" {...field} />
                          </FormControl>
                          <FormDescription>
                            The official name of your organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="construction">Construction</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="energy">Energy</SelectItem>
                              <SelectItem value="transportation">Transportation</SelectItem>
                              <SelectItem value="mining">Mining</SelectItem>
                              <SelectItem value="agriculture">Agriculture</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The primary industry your organization operates in
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={generalForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="501-1000">501-1000 employees</SelectItem>
                            <SelectItem value="1001+">1001+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The number of employees in your organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={generalForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State/Province" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip/Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Zip/Postal Code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your organization's website (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={generalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe your organization"
                            className="resize-none h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of your organization (max 500 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        console.log("Test toast button clicked");
                        showToast({
                          title: "Test Toast",
                          description: "This is a test toast to verify the toast system is working",
                        });
                      }}
                    >
                      Test Toast
                    </Button>
                    <Button type="submit" disabled={generalSaving}>
                      {generalSaving ? "Saving..." : "Save organization settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="hours">
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>
              Configure your organization's working hours and days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hoursLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <Form {...hoursForm}>
                <form 
                  onSubmit={(e) => {
                    console.log("Hours form submitted");
                    hoursForm.handleSubmit(onSubmitHours)(e);
                  }} 
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Working Days</h3>
                    <div className="grid gap-4 md:grid-cols-4">
                      <FormField
                        control={hoursForm.control}
                        name="workDays.monday"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <FormLabel className="font-normal">Monday</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hoursForm.control}
                        name="workDays.tuesday"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <FormLabel className="font-normal">Tuesday</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hoursForm.control}
                        name="workDays.wednesday"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <FormLabel className="font-normal">Wednesday</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hoursForm.control}
                        name="workDays.thursday"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <FormLabel className="font-normal">Thursday</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hoursForm.control}
                        name="workDays.friday"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <FormLabel className="font-normal">Friday</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hoursForm.control}
                        name="workDays.saturday"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <FormLabel className="font-normal">Saturday</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hoursForm.control}
                        name="workDays.sunday"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <FormLabel className="font-normal">Sunday</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={hoursForm.control}
                      name="workHoursStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Hours Start</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={hoursForm.control}
                      name="workHoursEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Hours End</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={hoursForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                            <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                            <SelectItem value="Etc/UTC">Universal Time Coordinated (UTC)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your organization's primary timezone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={hoursForm.control}
                    name="enableAfterHoursAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable After-Hours Alerts</FormLabel>
                          <FormDescription>
                            Send alerts for critical safety issues even outside of working hours
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={hoursSaving}>
                      {hoursSaving ? "Saving..." : "Save working hours"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="branding">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize your organization's branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            {brandingLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Logo</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                      {brandingSettings.logoURL && brandingSettings.logoURL !== "/placeholder-logo.png" ? (
                        <img 
                          src={brandingSettings.logoURL} 
                          alt="Organization logo" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // If image fails to load, fall back to the Building2 icon
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-muted">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-muted-foreground">
                                  <rect width="16" height="20" x="4" y="2" rx="2" />
                                  <path d="M9 22v-4h6v4" />
                                  <path d="M8 6h.01" />
                                  <path d="M16 6h.01" />
                                  <path d="M12 6h.01" />
                                  <path d="M8 10h.01" />
                                  <path d="M16 10h.01" />
                                  <path d="M12 10h.01" />
                                  <path d="M8 14h.01" />
                                  <path d="M16 14h.01" />
                                  <path d="M12 14h.01" />
                                </svg>
                              </div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Building2 className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-medium">Organization Logo</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your organization logo. Recommended size: 512x512px.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="logo-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          disabled={brandingSaving}
                        >
                          {brandingSaving ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload logo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 border"></div>
                        <span className="text-sm">{brandingSettings.primaryColor}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-800 border"></div>
                        <span className="text-sm">{brandingSettings.secondaryColor}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 border"></div>
                        <span className="text-sm">{brandingSettings.accentColor}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Color customization will be available in an upcoming update.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 