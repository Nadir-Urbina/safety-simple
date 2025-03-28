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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
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
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle, Download, Upload, Trash2 } from "lucide-react";
import { useDataManagementSettings } from "../../../../hooks/use-organization-settings";
import { DataManagementSettings as DataManagementSettingsType } from "../../../../lib/settings";

const dataManagementSchema = z.object({
  autoBackup: z.boolean(),
  backupFrequency: z.string(),
  backupLocation: z.string(),
  retentionPeriod: z.string(),
  encryptBackups: z.boolean(),
  compressionLevel: z.string(),
  allowDataDeletion: z.boolean(),
  backupReminders: z.boolean(),
});

type DataManagementValues = z.infer<typeof dataManagementSchema>;

const defaultDataManagementSettings: DataManagementSettingsType = {
  autoBackup: true,
  backupFrequency: "daily",
  backupLocation: "cloud",
  retentionPeriod: "30-days",
  encryptBackups: true,
  compressionLevel: "medium",
  allowDataDeletion: false,
  backupReminders: true,
};

export function DataManagement() {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const { 
    settings, 
    loading, 
    saving, 
    updateSettings 
  } = useDataManagementSettings(defaultDataManagementSettings);

  const form = useForm<DataManagementValues>({
    resolver: zodResolver(dataManagementSchema),
    defaultValues: settings
  });

  // Update form values when settings load
  useEffect(() => {
    if (!loading && settings) {
      form.reset(settings);
    }
  }, [settings, loading]);

  const onSubmit = async (data: DataManagementValues) => {
    await updateSettings(data);
  };

  const handleExportData = async () => {
    setExportLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Data export initiated",
        description: "Your data export has been started. You'll receive an email when it's ready to download.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "We couldn't export your data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportData = async () => {
    setImportLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Data import completed",
        description: "Your data has been imported successfully.",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "We couldn't import your data. Please check the file format and try again.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteText !== "DELETE ALL DATA") {
      toast({
        title: "Confirmation failed",
        description: "Please type 'DELETE ALL DATA' to confirm.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Data deletion initiated",
        description: "All your data is being deleted. This process may take some time to complete.",
      });
      
      setShowDeleteConfirm(false);
      setDeleteText("");
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "We couldn't delete your data. Please try again later.",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Backup & Retention</CardTitle>
          <CardDescription>
            Configure how your data is backed up and stored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="autoBackup"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable automatic backups</FormLabel>
                          <FormDescription>
                            Automatically back up your data on a schedule
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="backupFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often to create backups
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="backupLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="local">Local Storage</SelectItem>
                            <SelectItem value="cloud">Cloud Storage</SelectItem>
                            <SelectItem value="both">Both (Local & Cloud)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Where to store your backups
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="retentionPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Retention Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="7-days">7 Days</SelectItem>
                            <SelectItem value="30-days">30 Days</SelectItem>
                            <SelectItem value="90-days">90 Days</SelectItem>
                            <SelectItem value="180-days">180 Days</SelectItem>
                            <SelectItem value="365-days">1 Year</SelectItem>
                            <SelectItem value="indefinite">Indefinite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How long to keep backups
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="encryptBackups"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Encrypt backups</FormLabel>
                          <FormDescription>
                            Secure your backups with encryption
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="compressionLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compression Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select compression" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Level of compression for backups
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="allowDataDeletion"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Allow data deletion</FormLabel>
                          <FormDescription>
                            Allow administrators to permanently delete data
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="backupReminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Backup reminders</FormLabel>
                          <FormDescription>
                            Receive notifications for backup status and errors
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save backup settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Import & Export</CardTitle>
          <CardDescription>
            Export your data or import from a backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Export Data</CardTitle>
                <CardDescription>
                  Export all your data to a file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This will export all your forms, submissions, and configuration settings.
                  The export file can be used as a backup or to migrate to another instance.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleExportData}
                  disabled={exportLoading}
                >
                  {exportLoading ? "Exporting..." : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export All Data
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Import Data</CardTitle>
                <CardDescription>
                  Import data from a backup file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This will import data from a backup file.
                  Existing data may be overwritten if there are conflicts.
                </p>
                <Alert variant="warning" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Importing data may overwrite existing information.
                    Please ensure you have a backup before proceeding.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleImportData}
                  disabled={importLoading}
                >
                  {importLoading ? "Importing..." : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete all your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Caution</AlertTitle>
            <AlertDescription>
              This action cannot be undone. All your data will be permanently deleted.
              Please be certain before proceeding.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-600">Delete All Data?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All your forms, submissions, and settings
                  will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    To confirm, type "DELETE ALL DATA" in the field below:
                  </p>
                  <Input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="DELETE ALL DATA"
                    className="border-red-300"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAllData}
                  disabled={saving || deleteText !== "DELETE ALL DATA"}
                >
                  {saving ? "Deleting..." : "Permanently Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
} 