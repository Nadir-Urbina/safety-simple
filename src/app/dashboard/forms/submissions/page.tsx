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
import { FormTemplate, FormSubmission, SubmissionStatus } from "@/types/forms"
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
  RefreshCw
} from "lucide-react"
import * as XLSX from 'xlsx'
import { Checkbox } from "@/components/ui/checkbox"

interface FormInfo {
  id: string;
  name: string;
}

export default function SubmissionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([])
  const [formsList, setFormsList] = useState<FormInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<SubmissionStatus | "all">("all")
  const [selectedFormId, setSelectedFormId] = useState<string>("")
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [submissionDetails, setSubmissionDetails] = useState<{
    submission: FormSubmission;
    formTemplate: FormTemplate | null;
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
        
        // Load submissions
        const submissionsRef = collection(db, "organizations", organization.id, "formSubmissions")
        let submissionsQuery = query(
          submissionsRef,
          orderBy("submittedAt", "desc"),
          limit(100)
        )
        
        if (formIdParam && formIdParam !== 'all') {
          submissionsQuery = query(
            submissionsRef,
            where("formTemplateId", "==", formIdParam),
            orderBy("submittedAt", "desc"),
            limit(100)
          )
        }
        
        const submissionsSnapshot = await getDocs(submissionsQuery)
        
        const submissionsList: FormSubmission[] = []
        submissionsSnapshot.forEach((doc) => {
          const submissionData = doc.data() as FormSubmission
          // Convert Firestore timestamps to Date objects
          submissionsList.push({
            ...submissionData,
            submittedAt: submissionData.submittedAt?.toDate() || new Date(),
          })
        })
        
        setSubmissions(submissionsList)
        setFilteredSubmissions(submissionsList)
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
    let filtered = [...submissions]
    
    // Filter by form if selected
    if (filterFormId && filterFormId !== 'all') {
      filtered = filtered.filter(submission => submission.formTemplateId === filterFormId)
    }
    
    // Filter by status if not "all"
    if (activeTab !== "all") {
      filtered = filtered.filter(submission => submission.status === activeTab)
    }
    
    // Apply search if provided (searching user id for now, would search name with proper user data)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(submission => 
        submission.submittedBy.toLowerCase().includes(query)
      )
    }
    
    setFilteredSubmissions(filtered)
  }, [submissions, searchQuery, activeTab, filterFormId])
  
  // Function to get form name by ID
  const getFormName = (formId: string) => {
    const form = formsList.find(f => f.id === formId)
    return form ? form.name : "Unknown Form"
  }
  
  // Update submission status
  const updateSubmissionStatus = async (submissionId: string, newStatus: SubmissionStatus) => {
    if (!organization?.id) return
    
    try {
      // Would need to find the right doc reference from Firestore first in a real app
      // For now, just update the local state
      const updatedSubmissions = submissions.map(sub => {
        if (sub.id === submissionId) {
          return { ...sub, status: newStatus }
        }
        return sub
      })
      
      setSubmissions(updatedSubmissions)
      toast.success(`Submission marked as ${newStatus}`)
    } catch (error) {
      console.error("Error updating submission:", error)
      toast.error("Failed to update submission")
    }
  }
  
  // View submission details
  const viewSubmissionDetails = async (submission: FormSubmission) => {
    if (!organization?.id) return
    
    try {
      // Load the form template to understand field structure
      const formRef = doc(db, "organizations", organization.id, "formTemplates", submission.formTemplateId)
      const formDoc = await getDoc(formRef)
      
      let formTemplate = null
      if (formDoc.exists()) {
        formTemplate = formDoc.data() as FormTemplate
      }
      
      // In a real app, you'd also load user info for submitter name
      const submitterName = submission.submittedBy
      
      setSubmissionDetails({
        submission,
        formTemplate,
        submitterName
      })
      
      setShowDetailsDialog(true)
    } catch (error) {
      console.error("Error loading submission details:", error)
      toast.error("Failed to load submission details")
    }
  }
  
  // Get status badge
  const getStatusBadge = (status: SubmissionStatus) => {
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
  
  // Get status text (for export)
  const getStatusText = (status: SubmissionStatus) => {
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
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setActiveTab("all")
    setFilterFormId("all")
    router.push("/dashboard/forms/submissions")
  }
  
  // Export to Excel
  const exportToExcel = async () => {
    try {
      let excelData = []
      
      if (exportWithDetails && filteredSubmissions.length > 0) {
        // More detailed export including form fields
        // First, collect all unique field labels across all form templates
        const uniqueFields = new Set<string>()
        const formTemplatesMap = new Map<string, FormTemplate>()
        
        // Load all form templates used in filtered submissions
        const formTemplateIds = Array.from(
          new Set(filteredSubmissions.map(sub => sub.formTemplateId))
        )
        
        if (organization?.id) {
          for (const templateId of formTemplateIds) {
            try {
              const formRef = doc(db, "organizations", organization.id, "formTemplates", templateId)
              const formDoc = await getDoc(formRef)
              
              if (formDoc.exists()) {
                const template = formDoc.data() as FormTemplate
                formTemplatesMap.set(templateId, template)
                
                // Collect fields from this template
                template.fields?.forEach(field => {
                  if (!field.deprecated) {
                    uniqueFields.add(field.label)
                  }
                })
              }
            } catch (err) {
              console.error(`Error loading form template ${templateId}:`, err)
            }
          }
        }
        
        // Create data with all possible fields
        excelData = filteredSubmissions.map(submission => {
          const baseData = {
            'Form Name': getFormName(submission.formTemplateId),
            'Submitted By': submission.submittedBy,
            'Submission Date': format(submission.submittedAt, "MMM d, yyyy h:mm a"),
            'Status': getStatusText(submission.status),
            'Form ID': submission.formTemplateId,
            'Submission ID': submission.id
          }
          
          // Add field values if we have the template
          const template = formTemplatesMap.get(submission.formTemplateId)
          const fieldValues: Record<string, any> = {}
          
          if (template?.fields) {
            template.fields
              .filter(field => !field.deprecated)
              .forEach(field => {
                const value = submission.values[field.id]
                let displayValue = ''
                
                if (value !== undefined && value !== null) {
                  // Format based on field type
                  switch (field.type) {
                    case 'date':
                      displayValue = value ? format(new Date(value), "yyyy-MM-dd") : ''
                      break
                    case 'select':
                    case 'radio':
                      const option = field.options?.find(o => o.value === value)
                      displayValue = option?.label || value
                      break
                    case 'multiselect':
                      if (Array.isArray(value)) {
                        displayValue = value.map(v => {
                          const opt = field.options?.find(o => o.value === v)
                          return opt?.label || v
                        }).join(', ')
                      } else {
                        displayValue = String(value)
                      }
                      break
                    case 'checkbox':
                      displayValue = value ? 'Yes' : 'No'
                      break
                    default:
                      displayValue = String(value)
                  }
                }
                
                fieldValues[field.label] = displayValue
              })
          }
          
          return { ...baseData, ...fieldValues }
        })
      } else {
        // Basic export with just submission metadata
        excelData = filteredSubmissions.map(submission => ({
          'Form Name': getFormName(submission.formTemplateId),
          'Submitted By': submission.submittedBy,
          'Submission Date': format(submission.submittedAt, "MMM d, yyyy h:mm a"),
          'Status': getStatusText(submission.status),
          'Form ID': submission.formTemplateId,
          'Submission ID': submission.id
        }))
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions")

      // Generate filename with current date
      const dateStr = format(new Date(), "yyyy-MM-dd")
      const fileName = `form-submissions-${dateStr}.xlsx`

      // Trigger download
      XLSX.writeFile(workbook, fileName)
      setExportDialogOpen(false)
      toast.success("Export successful")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data")
      setExportDialogOpen(false)
    }
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
                {formsList.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SubmissionStatus | "all")} className="mb-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="inReview">In Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
                        {getFormName(submission.formTemplateId)}
                      </TableCell>
                      <TableCell>{submission.submittedBy}</TableCell>
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
                              onClick={() => updateSubmissionStatus(submission.id, "inReview")}
                              disabled={submission.status === "inReview"}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Mark as In Review
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateSubmissionStatus(submission.id, "approved")}
                              disabled={submission.status === "approved"}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateSubmissionStatus(submission.id, "rejected")}
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
          Showing {filteredSubmissions.length} of {submissions.length} submissions
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
                  <h3 className="font-medium">Form: {getFormName(submissionDetails.submission.formTemplateId)}</h3>
                  <p className="text-sm text-muted-foreground">Status: {getStatusBadge(submissionDetails.submission.status)}</p>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/50">
                <h3 className="font-medium mb-4">Submission Values</h3>
                
                {submissionDetails.formTemplate ? (
                  <div className="grid gap-4">
                    {submissionDetails.formTemplate.fields
                      ?.filter(field => !field.deprecated)
                      .sort((a, b) => a.order - b.order)
                      .map((field) => {
                        const fieldValue = submissionDetails.submission.values[field.id]
                        
                        return (
                          <div key={field.id} className="grid grid-cols-3 gap-2">
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="col-span-2">
                              {renderFieldValue(field.type, fieldValue, field)}
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
                      updateSubmissionStatus(submissionDetails.submission.id, "approved")
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
                      updateSubmissionStatus(submissionDetails.submission.id, "rejected")
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

// Helper function to render field value based on type
function renderFieldValue(type: string, value: any, field: any) {
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
      return <span>File uploaded</span>
    default:
      return <span>{JSON.stringify(value)}</span>
  }
} 