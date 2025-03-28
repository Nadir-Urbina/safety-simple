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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useComplianceSettings } from "../../../../hooks/use-organization-settings";
import { ComplianceSettings as ComplianceSettingsType } from "../../../../lib/settings";

const complianceSchema = z.object({
  enableOSHACompliance: z.boolean(),
  enableISO45001: z.boolean(),
  enableCustomRegulations: z.boolean(),
  autoExportReports: z.boolean(),
  retentionPeriod: z.string(),
  complianceManager: z.string().email({
    message: "Please enter a valid email address",
  }),
  complianceNotes: z.string().max(500, {
    message: "Notes must be less than 500 characters",
  }).optional(),
  requiredSignatureForCritical: z.boolean(),
  enableAuditTrail: z.boolean(),
  enableVersionControl: z.boolean(),
});

type ComplianceValues = z.infer<typeof complianceSchema>;

// Sample regulations data
type Regulation = {
  id: string;
  name: string;
  enabled: boolean;
  lastUpdated: string;
};

const defaultRegulations: Regulation[] = [
  { id: "osha-1904", name: "OSHA 1904 - Recordkeeping", enabled: true, lastUpdated: "2023-09-15" },
  { id: "osha-1910", name: "OSHA 1910 - General Industry", enabled: true, lastUpdated: "2023-08-20" },
  { id: "iso-45001", name: "ISO 45001 - Occupational Health & Safety", enabled: false, lastUpdated: "2023-07-10" },
  { id: "epa-tier2", name: "EPA - Tier II Reporting", enabled: false, lastUpdated: "2023-06-30" },
  { id: "msha-30cfr", name: "MSHA 30 CFR - Mine Safety", enabled: false, lastUpdated: "2023-05-15" },
];

const defaultComplianceSettings: ComplianceSettingsType = {
  enableOSHACompliance: true,
  enableISO45001: false,
  enableCustomRegulations: false,
  autoExportReports: true,
  retentionPeriod: "7-years",
  complianceManager: "",
  complianceNotes: "",
  requiredSignatureForCritical: true,
  enableAuditTrail: true,
  enableVersionControl: false,
};

export function ComplianceSettings() {
  const { toast } = useToast();
  const [regulations, setRegulations] = useState<Regulation[]>(defaultRegulations);
  
  const { 
    settings, 
    loading, 
    saving, 
    updateSettings 
  } = useComplianceSettings(defaultComplianceSettings);

  const form = useForm<ComplianceValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: settings
  });

  // Update form values when settings load
  useEffect(() => {
    if (!loading && settings) {
      form.reset(settings);
    }
  }, [settings, loading]);

  const onSubmit = async (data: ComplianceValues) => {
    await updateSettings(data);
  };

  const handleRegulationToggle = (id: string) => {
    const updatedRegulations = regulations.map(reg => 
      reg.id === id ? { ...reg, enabled: !reg.enabled } : reg
    );
    setRegulations(updatedRegulations);
    
    // In a real implementation, we'd save this to the database
    toast({
      title: "Regulations updated",
      description: `${updatedRegulations.find(r => r.id === id)?.name} ${updatedRegulations.find(r => r.id === id)?.enabled ? 'enabled' : 'disabled'}.`,
    });
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
          <CardTitle>Compliance Settings</CardTitle>
          <CardDescription>
            Configure compliance features and reporting to meet regulatory requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Regulatory Compliance</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="enableOSHACompliance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>OSHA Compliance</FormLabel>
                          <FormDescription>
                            Enable OSHA compliance features and reporting
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enableISO45001"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>ISO 45001 Compliance</FormLabel>
                          <FormDescription>
                            Enable ISO 45001 occupational health and safety standards
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="enableCustomRegulations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Custom Regulations</FormLabel>
                        <FormDescription>
                          Enable support for custom regulatory requirements
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Retention & Reporting</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="retentionPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Retention Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-year">1 Year</SelectItem>
                            <SelectItem value="3-years">3 Years</SelectItem>
                            <SelectItem value="5-years">5 Years</SelectItem>
                            <SelectItem value="7-years">7 Years (OSHA Requirement)</SelectItem>
                            <SelectItem value="10-years">10 Years</SelectItem>
                            <SelectItem value="indefinite">Indefinite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How long to retain compliance records
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="autoExportReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Automatic Compliance Reports</FormLabel>
                          <FormDescription>
                            Automatically generate and export compliance reports
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Advanced Features</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="requiredSignatureForCritical"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Require Signature for Critical Items</FormLabel>
                          <FormDescription>
                            Require digital signature for critical safety issues
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enableAuditTrail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable Audit Trail</FormLabel>
                          <FormDescription>
                            Track all changes to compliance-related data
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enableVersionControl"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Document Version Control</FormLabel>
                          <FormDescription>
                            Track and manage versions of compliance documents
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="complianceManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance Manager Email</FormLabel>
                      <FormControl>
                        <Input placeholder="compliance@yourcompany.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Designated compliance manager to receive reports and alerts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="complianceNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special compliance considerations or requirements"
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional compliance notes or special instructions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save compliance settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Regulations</CardTitle>
          <CardDescription>
            Manage which regulations are tracked in your compliance program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of available regulatory frameworks</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Regulation</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regulations.map((regulation) => (
                <TableRow key={regulation.id}>
                  <TableCell className="font-medium">{regulation.name}</TableCell>
                  <TableCell>{regulation.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <Switch 
                      checked={regulation.enabled} 
                      onCheckedChange={() => handleRegulationToggle(regulation.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Compliance Resources</CardTitle>
          <CardDescription>
            Documentation and resources for compliance management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="osha">
              <AccordionTrigger>OSHA Requirements</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">
                  The Occupational Safety and Health Administration (OSHA) requires certain records to be maintained for workplace safety:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>OSHA Form 300: Log of Work-Related Injuries and Illnesses</li>
                  <li>OSHA Form 301: Injury and Illness Incident Report</li>
                  <li>OSHA Form 300A: Summary of Work-Related Injuries and Illnesses</li>
                  <li>Records must be maintained for 5 years following the calendar year they cover</li>
                </ul>
                <a 
                  href="https://www.osha.gov/recordkeeping" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-block mt-2"
                >
                  Learn more about OSHA recordkeeping requirements
                </a>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="iso">
              <AccordionTrigger>ISO 45001 Overview</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">
                  ISO 45001 is an international standard for occupational health and safety management systems. Key components include:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Context of the organization</li>
                  <li>Leadership and worker participation</li>
                  <li>Planning</li>
                  <li>Support</li>
                  <li>Operation</li>
                  <li>Performance evaluation</li>
                  <li>Improvement</li>
                </ul>
                <a 
                  href="https://www.iso.org/iso-45001-occupational-health-and-safety.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-block mt-2"
                >
                  Learn more about ISO 45001
                </a>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="retention">
              <AccordionTrigger>Data Retention Best Practices</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">
                  Recommended data retention periods for safety records:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>OSHA 300, 300A, 301 logs: 5 years minimum</li>
                  <li>Training records: Duration of employment + 3 years</li>
                  <li>Medical surveillance: Duration of employment + 30 years</li>
                  <li>Safety Data Sheets (SDS): 30 years</li>
                  <li>Exposure monitoring: 30 years</li>
                  <li>Equipment inspections and maintenance: Life of equipment + 1 year</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
} 