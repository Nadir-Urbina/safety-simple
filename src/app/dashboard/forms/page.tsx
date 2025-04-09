"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { FormTemplate } from "@/src/types/forms"
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  File, 
  FilePlus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Eye, 
  ClipboardCopy, 
  Search, 
  ToggleLeft, 
  ToggleRight,
  FileText,
  AlertCircle,
  BookCopy
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { processFirestoreData } from "@/lib/firebase-utils"

export default function FormsManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [filteredForms, setFilteredForms] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  
  // Load forms from Firestore
  useEffect(() => {
    const loadForms = async () => {
      if (!organization?.id) return
      
      try {
        setIsLoading(true)
        
        const formTemplatesQuery = query(
          collection(db, "organizations", organization.id, "formTemplates"),
          orderBy("createdAt", "desc")
        )
        
        const formTemplatesSnapshot = await getDocs(formTemplatesQuery)
        const forms: FormTemplate[] = []
        
        formTemplatesSnapshot.forEach((doc) => {
          const formData = doc.data() as Omit<FormTemplate, "id">
          const processedData = processFirestoreData(formData)
          
          forms.push({
            id: doc.id,
            ...processedData,
          })
        })
        
        // Sort by updatedAt date (newest first)
        forms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        
        setForms(forms)
        setFilteredForms(forms)
      } catch (error) {
        console.error("Error loading forms:", error)
        toast.error("Failed to load forms")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (organization?.id) {
      loadForms()
    }
  }, [organization?.id])
  
  // Filter forms based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredForms(forms)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = forms.filter(
        (form) =>
          form.name.toLowerCase().includes(query) ||
          form.description?.toLowerCase().includes(query)
      )
      setFilteredForms(filtered)
    }
  }, [searchQuery, forms])
  
  // Filter forms based on active tab
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredForms(forms)
    } else if (activeTab === "active") {
      setFilteredForms(forms.filter(form => form.isActive))
    } else if (activeTab === "inactive") {
      setFilteredForms(forms.filter(form => !form.isActive))
    } else if (activeTab === "templates") {
      setFilteredForms(forms.filter(form => form.copiedFromTemplateId))
    } else if (activeTab === "incident") {
      setFilteredForms(forms.filter(form => form.category === "incident"))
    } else if (activeTab === "recognition") {
      setFilteredForms(forms.filter(form => form.category === "recognition"))
    } else if (activeTab === "heatPrevention") {
      setFilteredForms(forms.filter(form => form.category === "heatPrevention"))
    } else if (activeTab === "other") {
      setFilteredForms(forms.filter(form => form.category === "other"))
    }
  }, [activeTab, forms])
  
  // Toggle form active status
  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    if (!organization?.id) return
    
    try {
      const formRef = doc(db, "organizations", organization.id, "formTemplates", formId)
      await updateDoc(formRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      })
      
      // Update local state
      setForms(forms.map(form => {
        if (form.id === formId) {
          return {
            ...form,
            isActive: !currentStatus,
            updatedAt: new Date()
          }
        }
        return form
      }))
      
      toast.success(`Form ${!currentStatus ? "activated" : "deactivated"} successfully`)
    } catch (error) {
      console.error("Error toggling form status:", error)
      toast.error("Failed to update form status")
    }
  }
  
  // Delete form
  const deleteForm = async () => {
    if (!organization?.id || !selectedFormId) return
    
    try {
      const formRef = doc(db, "organizations", organization.id, "formTemplates", selectedFormId)
      await deleteDoc(formRef)
      
      // Update local state
      setForms(forms.filter(form => form.id !== selectedFormId))
      toast.success("Form deleted successfully")
    } catch (error) {
      console.error("Error deleting form:", error)
      toast.error("Failed to delete form")
    } finally {
      setShowDeleteDialog(false)
      setSelectedFormId(null)
    }
  }
  
  // Get category badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "incident":
        return <Badge variant="destructive">Incident Report</Badge>
      case "recognition":
        return <Badge variant="success">Recognition</Badge>
      case "heatPrevention":
        return <Badge variant="warning">Heat Prevention</Badge>
      case "other":
      default:
        return <Badge variant="secondary">Other</Badge>
    }
  }
  
  // Create a new form
  const createNewForm = () => {
    router.push("/dashboard/forms/builder")
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading forms...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Form Management</h1>
        <Button onClick={createNewForm} size="lg" className="gap-2">
          <FilePlus className="h-5 w-5" />
          Create New Form
        </Button>
      </div>
      
      {forms.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">No Forms Created Yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first form to start collecting safety data from your team.
              Forms can be used for incident reports, safety observations, and more.
            </p>
            <Button onClick={createNewForm} size="lg" className="gap-2">
              <FilePlus className="h-5 w-5" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-2 md:grid-cols-8">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="templates">From Templates</TabsTrigger>
                <TabsTrigger value="incident">Incident</TabsTrigger>
                <TabsTrigger value="recognition">Recognition</TabsTrigger>
                <TabsTrigger value="heatPrevention">Heat Prevention</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Manage Forms</CardTitle>
              <CardDescription>
                Create and manage custom forms for your organization. Forms can be used to collect
                data for incident reports, employee recognition, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredForms.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-md">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No forms found</h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    {searchQuery
                      ? "No forms match your search criteria."
                      : "You haven't created any forms yet."}
                  </p>
                  <Button onClick={createNewForm}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Create Your First Form
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Form Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForms.map((form) => (
                        <TableRow key={form.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <File className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span>{form.name}</span>
                                {form.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {form.description.length > 50
                                      ? `${form.description.substring(0, 50)}...`
                                      : form.description}
                                  </div>
                                )}
                                {form.copiedFromTemplateId && (
                                  <Badge variant="outline" className="text-xs mt-1 w-fit bg-blue-50 text-blue-700 border-blue-200">
                                    <BookCopy className="h-3 w-3 mr-1" />
                                    Template-based
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getCategoryBadge(form.category)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {form.isActive ? (
                                <div className="flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                                  <span>Active</span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-gray-300 mr-2" />
                                  <span>Inactive</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(form.updatedAt, "MMM d, yyyy")}
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
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/builder?id=${form.id}`)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Form
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/view?id=${form.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Form
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleFormStatus(form.id, form.isActive)}>
                                  {form.isActive ? (
                                    <>
                                      <ToggleLeft className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600" 
                                  onClick={() => {
                                    setSelectedFormId(form.id)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
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
              {filteredForms.length > 0 ? (
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {filteredForms.length} {filteredForms.length === 1 ? "form" : "forms"} found
                </div>
              ) : null}
            </CardFooter>
          </Card>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the form and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700" 
                  onClick={deleteForm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
} 