"use client";

import { useState } from "react";
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
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const formSettingsSchema = z.object({
  defaultApprover: z.string().min(1, {
    message: "Please select a default approver.",
  }),
  autoApproveBasicForms: z.boolean(),
  requiredCompanyLogo: z.boolean(),
  retentionPeriod: z.string().min(1, {
    message: "Please select a retention period.",
  }),
  notifySubmitter: z.boolean(),
  notifyApprover: z.boolean(),
  allowComments: z.boolean(),
  allowAttachments: z.boolean(),
  maxAttachmentSize: z.string(),
  formInstructions: z.string().max(500).optional(),
});

type FormSettingsValues = z.infer<typeof formSettingsSchema>;

export function FormConfiguration() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormSettingsValues>({
    resolver: zodResolver(formSettingsSchema),
    defaultValues: {
      defaultApprover: "manager",
      autoApproveBasicForms: true,
      requiredCompanyLogo: true,
      retentionPeriod: "1-year",
      notifySubmitter: true,
      notifyApprover: true,
      allowComments: true,
      allowAttachments: true,
      maxAttachmentSize: "10",
      formInstructions: "Please complete all required fields marked with an asterisk (*)",
    },
  });

  const onSubmit = async (data: FormSettingsValues) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Form settings updated",
        description: "Your form configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Your form configuration couldn't be updated. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Configuration</CardTitle>
          <CardDescription>
            Configure default settings for all forms in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Approval Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="defaultApprover"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Approver Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select default approver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="custom">Custom Workflow</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The default role that approves form submissions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="autoApproveBasicForms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Auto-approve basic forms</FormLabel>
                          <FormDescription>
                            Automatically approve non-critical forms without manual review
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Appearance Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 pb-2 space-y-4">
                      <FormField
                        control={form.control}
                        name="requiredCompanyLogo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Show company logo on all forms</FormLabel>
                              <FormDescription>
                                Display your company logo at the top of all forms
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="formInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Form Instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Instructions to display at the top of all forms"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              These instructions will appear at the top of all forms unless overridden
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Data Retention Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 pb-2 space-y-4">
                      <FormField
                        control={form.control}
                        name="retentionPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Form Data Retention Period</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select retention period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="6-months">6 Months</SelectItem>
                                <SelectItem value="1-year">1 Year</SelectItem>
                                <SelectItem value="3-years">3 Years</SelectItem>
                                <SelectItem value="5-years">5 Years</SelectItem>
                                <SelectItem value="7-years">7 Years</SelectItem>
                                <SelectItem value="indefinite">Indefinite</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How long to keep form submission data
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>Notification Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 pb-2 space-y-4">
                      <FormField
                        control={form.control}
                        name="notifySubmitter"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Notify submitter on status change</FormLabel>
                              <FormDescription>
                                Send email notifications to form submitters when their submission status changes
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notifyApprover"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Notify approvers of new submissions</FormLabel>
                              <FormDescription>
                                Send email notifications to approvers when new forms are submitted
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>Attachment Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 pb-2 space-y-4">
                      <FormField
                        control={form.control}
                        name="allowAttachments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Allow file attachments</FormLabel>
                              <FormDescription>
                                Enable users to attach files to form submissions
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maxAttachmentSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Attachment Size (MB)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              The maximum file size for attachments in megabytes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>Collaboration Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 pb-2 space-y-4">
                      <FormField
                        control={form.control}
                        name="allowComments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Allow comments on submissions</FormLabel>
                              <FormDescription>
                                Enable users to add comments to form submissions
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 