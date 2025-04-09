"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  orderBy, 
  limit 
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { FormTemplate, FormSubmission, SubmissionStatus } from "@/src/types/forms"
import { HeatComplianceRecord, UnifiedSubmission } from "@/src/types"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  ClipboardList, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  FileText,
  RefreshCw,
  ExternalLink,
  Image,
  UserIcon
} from "lucide-react"
import * as XLSX from 'xlsx'
import { Checkbox } from "@/components/ui/checkbox"
import { processFirestoreData, toDate } from '@/lib/firebase-utils'

interface FormInfo {
  id: string;
  name: string;
}

async function getUserDisplayName(userId: string) {
  try {
    // First check if there's a user record in users collection
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists() && userDoc.data().displayName) {
      return userDoc.data().displayName;
    }
    
    // Fallback to checking organization members if available
    // This would require an extra query which might be expensive
    // Add implementation if needed
    
    return userId; // Fallback to user ID if no name found
  } catch (error) {
    console.error("Error fetching user display name:", error);
    return userId; // Fallback to ID on error
  }
}

export default function SubmissionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  const [unifiedSubmissions, setUnifiedSubmissions] = useState<UnifiedSubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<UnifiedSubmission[]>([])
  const [formsList, setFormsList] = useState<FormInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedFormId, setSelectedFormId] = useState<string>("")
  const [selectedSubmission, setSelectedSubmission] = useState<UnifiedSubmission | null>(null)
  const [submissionDetails, setSubmissionDetails] = useState<{
    submission: UnifiedSubmission;
    formTemplate?: FormTemplate | null;
    submitterName: string;
  } | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [filterFormId, setFilterFormId] = useState<string>("all")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportWithDetails, setExportWithDetails] = useState(false)
  
  // Initial form and submissions loading
  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) return
      
      try {
        setIsLoading(true)
        
        // Load forms first
        const formsRef = collection(db, "organizations", organization.id, "formTemplates")
        const formsQuery = query(formsRef)
        const formsSnapshot = await getDocs(formsQuery)
        
        const forms: FormInfo[] = []
        formsSnapshot.forEach((doc) => {
          const formData = doc.data()
          forms.push({
            id: doc.id,
            name: formData.name
          })
        })
        
        setFormsList(forms)
        
        // Check if specific form filter in URL
        const formIdParam = searchParams.get("formId")
        if (formIdParam) {
          setFilterFormId(formIdParam)
        }
        
        // Load form submissions
        const submissionsRef = collection(db, "organizations", organization.id, "formSubmissions")
        let submissionsQuery = query(
          submissionsRef,
          orderBy("submittedAt", "desc"),
          limit(100)
        )
        
        if (formIdParam && formIdParam !== 'all' && formIdParam !== 'heat-jsa') {
          submissionsQuery = query(
            submissionsRef,
            where("formTemplateId", "==", formIdParam),
            orderBy("submittedAt", "desc"),
            limit(100)
          )
        }
        
        const submissionsSnapshot = await getDocs(submissionsQuery)
        
        const formSubmissionsList: UnifiedSubmission[] = []
        const userDisplayNames: Record<string, string> = {}
        
        // First, collect all unique user IDs to batch our name lookups
        const userIds = new Set<string>()
        submissionsSnapshot.forEach((doc) => {
          const submissionData = doc.data() as FormSubmission
          userIds.add(submissionData.submittedBy)
        })
        
        // Look up display names for all users
        for (const userId of userIds) {
          userDisplayNames[userId] = await getUserDisplayName(userId)
        }
        
        // Now create the submissions with display names
        submissionsSnapshot.forEach((doc) => {
          const submissionData = doc.data() as FormSubmission
          // Convert to unified submission format
          formSubmissionsList.push({
            id: submissionData.id,
            type: 'form',
            formId: submissionData.formTemplateId,
            formName: getFormName(submissionData.formTemplateId),
            organizationId: submissionData.organizationId,
            submittedBy: submissionData.submittedBy,
            submittedByName: userDisplayNames[submissionData.submittedBy] || submissionData.submittedBy,
            submittedAt: toDate(submissionData.submittedAt) || new Date(),
            status: submissionData.status,
            category: 'form',
            originalFormSubmission: submissionData
          })
        })
        
        // Load heat compliance records
        let heatJsaRecords: UnifiedSubmission[] = []
        if (formIdParam === 'all' || formIdParam === 'heat-jsa' || !formIdParam) {
          const heatComplianceRef = collection(db, "heatComplianceRecords")
          const heatComplianceQuery = query(
            heatComplianceRef, 
            where("organizationId", "==", organization.id),
            orderBy("createdAt", "desc"),
            limit(100)
          )
          
          const heatComplianceSnapshot = await getDocs(heatComplianceQuery)
          
          heatComplianceSnapshot.forEach((doc) => {
            const recordData = doc.data() as HeatComplianceRecord
            // Convert to unified submission format
            heatJsaRecords.push({
              id: doc.id,
              type: 'heatCompliance',
              formName: 'Heat JSA',
              organizationId: recordData.organizationId,
              submittedBy: recordData.submittedBy,
              submittedByName: recordData.submittedByName,
              submittedAt: toDate(recordData.createdAt) || new Date(),
              status: recordData.status,
              category: 'heatPrevention',
              originalHeatRecord: recordData
            })
          })
        }
        
        // Combine both types of submissions and sort by date
        const allSubmissions = [...formSubmissionsList, ...heatJsaRecords]
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        
        setUnifiedSubmissions(allSubmissions)
        setFilteredSubmissions(allSubmissions)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load submissions")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (organization?.id) {
      loadData()
    }
  }, [organization?.id, searchParams])
  
  // Filter submissions based on search query and active tab
  useEffect(() => {
    let filtered = [...unifiedSubmissions]
    
    // Filter by form if selected
    if (filterFormId && filterFormId !== 'all') {
      if (filterFormId === 'heat-jsa') {
        filtered = filtered.filter(submission => submission.type === 'heatCompliance')
      } else {
        filtered = filtered.filter(submission => 
          submission.type === 'form' && submission.formId === filterFormId
        )
      }
    }
    
    // Filter by status if not "all"
    if (activeTab !== "all") {
      filtered = filtered.filter(submission => submission.status === activeTab)
    }
    
    // Apply search if provided
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(submission => {
        // Search in submitter name if available
        if (submission.submittedByName && 
            submission.submittedByName.toLowerCase().includes(query)) {
          return true
        }
        
        // Search in form name
        if (submission.formName && 
            submission.formName.toLowerCase().includes(query)) {
          return true
        }
        
        // Search in location for heat records
        if (submission.type === 'heatCompliance' && 
            submission.originalHeatRecord?.location?.toLowerCase().includes(query)) {
          return true
        }
        
        // Search in submitter ID as fallback
        return submission.submittedBy.toLowerCase().includes(query)
      })
    }
    
    setFilteredSubmissions(filtered)
  }, [unifiedSubmissions, searchQuery, activeTab, filterFormId])
  
  // Function to get form name by ID
  const getFormName = (formId: string | undefined) => {
    if (!formId) return "Unknown Form";
    const form = formsList.find(f => f.id === formId);
    return form ? form.name : "Unknown Form";
  };
  
  // Update submission status
  const updateSubmissionStatus = async (submission: UnifiedSubmission, newStatus: string) => {
    if (!organization?.id) return
    
    try {
      if (submission.type === 'form') {
        // Handle form submission status update
        const submissionRef = doc(
          db, 
          "organizations", 
          organization.id, 
          "formSubmissions", 
          submission.id
        )
        
        await updateDoc(submissionRef, {
          status: newStatus,
          reviewedBy: user?.uid,
          reviewedAt: new Date()
        })
      } else if (submission.type === 'heatCompliance') {
        // Handle heat compliance record status update
        const recordRef = doc(db, "heatComplianceRecords", submission.id)
        
        await updateDoc(recordRef, {
          status: newStatus,
          updatedAt: new Date()
        })
      }
      
      // Update local state
      const updatedSubmissions = unifiedSubmissions.map(sub => {
        if (sub.id === submission.id) {
          return { ...sub, status: newStatus }
        }
        return sub
      })
      
      setUnifiedSubmissions(updatedSubmissions)
      toast.success(`Submission marked as ${newStatus}`)
    } catch (error) {
      console.error("Error updating submission:", error)
      toast.error("Failed to update submission")
    }
  }
  
  // View submission details
  const viewSubmissionDetails = async (submission: UnifiedSubmission) => {
    if (!organization?.id) return
    
    try {
      if (submission.type === 'form') {
        // Load the form template to understand field structure
        const formRef = doc(
          db, 
          "organizations", 
          organization.id, 
          "formTemplates", 
          submission.formId || ''
        )
        const formDoc = await getDoc(formRef)
        
        let formTemplate = null
        if (formDoc.exists()) {
          formTemplate = formDoc.data() as FormTemplate
        }
        
        // In a real app, you'd also load user info for submitter name
        const submitterName = submission.submittedByName || submission.submittedBy
        
        setSubmissionDetails({
          submission,
          formTemplate,
          submitterName
        })
      } else if (submission.type === 'heatCompliance') {
        // Heat compliance records don't need a template
        const submitterName = submission.submittedByName || submission.submittedBy
        
        setSubmissionDetails({
          submission,
          submitterName
        })
      }
      
      setShowDetailsDialog(true)
    } catch (error) {
      console.error("Error loading submission details:", error)
      toast.error("Failed to load submission details")
    }
  }
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="default">Submitted</Badge>
      case "inReview":
        return <Badge variant="secondary">In Review</Badge>
      case "approved":
        return <Badge variant="success">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Get category badge
  const getCategoryBadge = (submission: UnifiedSubmission) => {
    if (submission.type === 'heatCompliance') {
      return <Badge variant="warning">Heat JSA</Badge>
    }
    
    // For form submissions
    if (submission.category === 'incident') {
      return <Badge variant="destructive">Incident</Badge>
    } else if (submission.category === 'recognition') {
      return <Badge variant="success">Recognition</Badge>
    } else {
      return <Badge variant="secondary">Form</Badge>
    }
  }
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setActiveTab("all")
    setFilterFormId("all")
    router.push("/dashboard/forms/submissions")
  }
  
  // Export to Excel
  const exportToExcel = async () => {
    // More detailed export with field values
    // First, collect all form template IDs that we need
    const uniqueFields = new Set<string>()
    const formTemplatesMap = new Map<string, FormTemplate>()
    
    // Load all form templates mentioned in the filtered submissions
    if (organization?.id) {
      try {
        const formTemplateIds = new Set(
          filteredSubmissions
            .filter(sub => sub.type === 'form' && sub.formId)
            .map(sub => sub.formId)
        )
        
        if (formTemplateIds.size > 0) {
          for (const templateId of formTemplateIds) {
            try {
              // Skip undefined templateIds
              if (!templateId || !organization.id) continue;
              
              const formRef = doc(db, "organizations", organization.id, "formTemplates", templateId)
              const formDoc = await getDoc(formRef)
              
              if (formDoc.exists()) {
                const template = formDoc.data() as FormTemplate
                formTemplatesMap.set(templateId, template)
                
                // Collect fields from this template
                template.fields?.forEach(field => {
                  if (!field.deprecated) {
                    uniqueFields.add(field.id)
                  }
                })
              }
            } catch (error) {
              console.error(`Error loading template ${templateId}:`, error)
            }
          }
        }
      } catch (error) {
        console.error("Error preparing export:", error)
        toast.error("Failed to prepare export")
        return
      }
    }
    
    // Prepare the data rows
    const data = filteredSubmissions.map(submission => {
      const row: Record<string, any> = {
        ID: submission.id,
        Type: submission.type,
        Form: submission.formName,
        'Submitted By': submission.submittedByName,
        'Submitted At': format(submission.submittedAt, 'MMM d, yyyy h:mm a'),
        Status: submission.status
      }
      
      // For form submissions with field values
      if (submission.type === 'form' && submission.formId) {
        // Add field values if we have the template
        const template = formTemplatesMap.get(submission.formId)
        const fieldValues: Record<string, any> = {}
        
        // Check if it's a form submission with values
        if (template?.fields && submission.originalFormSubmission?.values) {
          template.fields
            .filter(field => !field.deprecated)
            .forEach(field => {
              const value = submission.originalFormSubmission.values[field.id]
              let displayValue = ''
              
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  displayValue = value.join(', ')
                } else if (value instanceof Date) {
                  displayValue = format(value, 'MMM d, yyyy')
                } else {
                  displayValue = String(value)
                }
              }
              
              fieldValues[`Field_${field.label || field.id}`] = displayValue
            })
        }
        
        // Add field values to the row
        Object.assign(row, fieldValues)
      }
      
      // For heat JSA records
      if (submission.type === 'heatCompliance' && submission.originalHeatRecord) {
        const record = submission.originalHeatRecord
        
        row['Temperature'] = record.temperature
        row['Humidity'] = record.humidity
        row['Heat Index'] = record.heatIndex
        row['Location'] = record.location
        row['Precautions'] = record.precautionsTaken?.join(', ') || ''
      }
      
      return row
    })
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Set column widths
    const colWidths = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length, 15) }))
    ws['!cols'] = colWidths
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Submissions')
    
    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
    const filename = `SafetySimple_Submissions_${timestamp}.xlsx`
    
    // Trigger download
    XLSX.writeFile(wb, filename)
    
    toast.success("Export complete!")
    setExportDialogOpen(false)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Form Submissions</h1>
        <div className="flex gap-2">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={filteredSubmissions.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Submissions</DialogTitle>
                <DialogDescription>
                  Export {filteredSubmissions.length} submissions to Excel
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="export-details" 
                    checked={exportWithDetails}
                    onCheckedChange={(checked) => 
                      setExportWithDetails(checked === true)
                    }
                  />
                  <label
                    htmlFor="export-details"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include form field values
                  </label>
                </div>
                <p className="text-muted-foreground text-sm mt-1 ml-6">
                  {exportWithDetails 
                    ? "This will include all form field values in the export (may take longer to generate)"
                    : "Export only basic submission information (faster)"}
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={exportToExcel}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Excel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={resetFilters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Submissions</CardTitle>
          <CardDescription>
            View and manage form submissions from your organization's users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by user..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={filterFormId} onValueChange={setFilterFormId}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Filter by form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                <SelectItem value="heat-jsa">Heat JSA</SelectItem>
                {formsList.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as string)} className="mb-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="inReview">In Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="heat-jsa">Heat JSA</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-md">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No submissions found</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery || filterFormId || activeTab !== "all"
                  ? "No submissions match your search criteria."
                  : "There are no form submissions yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {getFormName(submission.formId)}
                      </TableCell>
                      <TableCell>
                        {submission.submittedByName || submission.submittedBy}
                      </TableCell>
                      <TableCell>
                        {format(submission.submittedAt, "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewSubmissionDetails(submission)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateSubmissionStatus(submission, "inReview")}
                              disabled={submission.status === "inReview"}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Mark as In Review
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateSubmissionStatus(submission, "approved")}
                              disabled={submission.status === "approved"}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateSubmissionStatus(submission, "rejected")}
                              disabled={submission.status === "rejected"}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Showing {filteredSubmissions.length} of {unifiedSubmissions.length} submissions
        </CardFooter>
      </Card>
      
      {/* Submission Details Dialog */}
      {submissionDetails && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <DialogDescription>
                Submitted by {submissionDetails.submitterName} on{" "}
                {format(submissionDetails.submission.submittedAt, "MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Form: {getFormName(submissionDetails.submission.formId)}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    Status: {getStatusBadge(submissionDetails.submission.status)}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/50">
                <h3 className="font-medium mb-4">Submission Values</h3>
                
                {submissionDetails.submission.type === 'heatCompliance' && submissionDetails.submission.originalHeatRecord ? (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium text-sm">Job Number</div>
                      <div className="col-span-2">{submissionDetails.submission.originalHeatRecord.jobNumber}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium text-sm">Location</div>
                      <div className="col-span-2">{submissionDetails.submission.originalHeatRecord.location}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium text-sm">Heat Index</div>
                      <div className="col-span-2">
                        {submissionDetails.submission.originalHeatRecord.heatIndex}°F 
                        ({submissionDetails.submission.originalHeatRecord.riskLevel})
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium text-sm">Precautions Required</div>
                      <div className="col-span-2">
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {submissionDetails.submission.originalHeatRecord.precautionsRequired.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium text-sm">Precautions Taken</div>
                      <div className="col-span-2">
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {submissionDetails.submission.originalHeatRecord.precautionsTaken.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {submissionDetails.submission.originalHeatRecord.additionalNotes && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">Additional Notes</div>
                        <div className="col-span-2">{submissionDetails.submission.originalHeatRecord.additionalNotes}</div>
                      </div>
                    )}
                  </div>
                ) : submissionDetails.formTemplate ? (
                  <div className="grid gap-4">
                    {submissionDetails.formTemplate.fields
                      ?.filter(field => !field.deprecated)
                      .sort((a, b) => a.order - b.order)
                      .map((field) => {
                        const fieldValue = submissionDetails.submission.originalFormSubmission?.values?.[field.id]
                        
                        return (
                          <div key={field.id} className="grid grid-cols-3 gap-2">
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="col-span-2">
                              {renderFormFieldValue(field.type, fieldValue, field)}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-amber-500 italic">
                    Form template not available or has been deleted
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                
                {submissionDetails.submission.status !== "approved" && (
                  <Button
                    onClick={() => {
                      updateSubmissionStatus(submissionDetails.submission, "approved")
                      setShowDetailsDialog(false)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                )}
                
                {submissionDetails.submission.status !== "rejected" && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateSubmissionStatus(submissionDetails.submission, "rejected")
                      setShowDetailsDialog(false)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Function to render form field values (for form builder forms)
function renderFormFieldValue(type: string, value: any, field: any) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground italic">Not provided</span>
  }
  
  switch (type) {
    case 'text':
    case 'textarea':
      return <span>{value}</span>
    case 'number':
      return <span>{value}</span>
    case 'date':
      return value ? <span>{format(new Date(value), "MMMM d, yyyy")}</span> : null
    case 'select':
      // Find option label by value
      const selectedOption = field.options?.find((o: any) => o.value === value)
      return <span>{selectedOption?.label || value}</span>
    case 'multiselect':
      if (!Array.isArray(value)) return <span>{JSON.stringify(value)}</span>
      
      return (
        <div className="space-y-1">
          {value.map((v: string, i: number) => {
            const option = field.options?.find((o: any) => o.value === v)
            return <Badge key={i} variant="outline">{option?.label || v}</Badge>
          })}
        </div>
      )
    case 'checkbox':
      return value ? <span>Yes</span> : <span>No</span>
    case 'radio':
      const radioOption = field.options?.find((o: any) => o.value === value)
      return <span>{radioOption?.label || value}</span>
    case 'file':
      if (!value) return <span className="text-muted-foreground italic">No file uploaded</span>
      
      // If it's a URL string (saved in database)
      if (typeof value === 'string') {
        // Check if it's an image URL
        const isImageUrl = value.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null
        
        return (
          <div className="flex flex-col gap-2">
            {isImageUrl ? (
              <div className="relative">
                <a 
                  href={value} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-md w-32 h-24 border bg-muted flex items-center justify-center">
                    <img 
                      src={value} 
                      alt="Attachment" 
                      className="object-cover w-full h-full transition-opacity group-hover:opacity-90" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ExternalLink className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Image className="h-3 w-3 mr-1" />
                    View Image
                  </span>
                </a>
              </div>
            ) : (
              <a 
                href={value} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                Download File
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )
      }
      
      // If it's an object (form temporary state before submission)
      if (value.file) {
        return <span>File selected: {value.file.name}</span>
      }
      
      return <span>File uploaded</span>
      
    case 'employeeList':
      // For employee list fields, the value is a user ID
      if (!value) return <span className="text-muted-foreground italic">Not assigned</span>
      
      // Try to get employee name from the submission data or fall back to ID
      let employeeName = "";
      
      // If we've preloaded the user display names, use them
      if (typeof value === 'string' && field.options) {
        // The field.options might be populated with user data during submission viewing
        const employeeOption = field.options.find((o: any) => o.value === value)
        employeeName = employeeOption?.label || value
      } else {
        // Otherwise just show the ID with a user icon
        employeeName = value
      }
      
      return (
        <div className="flex items-center gap-1.5">
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{employeeName}</span>
        </div>
      )
      
    default:
      return <span>{JSON.stringify(value)}</span>
  }
}

// Helper function to get status text (for export)
function getStatusText(status: string) {
  switch (status) {
    case "submitted":
      return "Submitted"
    case "inReview":
      return "In Review"
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    case "draft":
      return "Draft"
    default:
      return status
  }
} 