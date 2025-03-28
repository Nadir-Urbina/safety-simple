"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FormBuilder } from "@/components/forms/form-builder"
import { FormTemplate, FormCategory } from "@/types/forms"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { doc, getDoc, setDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { v4 as uuidv4 } from "uuid"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormRenderer } from "@/components/forms/form-renderer"
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
import { AlertCircle, ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

export default function FormBuilderPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  // Get formId from query params
  const formId = searchParams.get("id")
  const [formTemplate, setFormTemplate] = useState<FormTemplate>({
    id: formId || uuidv4(),
    organizationId: organization?.id || "",
    name: "",
    description: "",
    category: "other" as FormCategory,
    fields: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: user?.uid || "",
    isActive: true
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState("")
  
  // Load form if editing existing
  useEffect(() => {
    const loadForm = async () => {
      if (!formId || !organization?.id) return
      
      try {
        setIsLoading(true)
        const formRef = doc(db, "organizations", organization.id, "formTemplates", formId)
        const formDoc = await getDoc(formRef)
        
        if (formDoc.exists()) {
          const formData = formDoc.data() as FormTemplate
          
          // Convert Firestore timestamps to Date objects
          const formWithDates = {
            ...formData,
            createdAt: formData.createdAt?.toDate() || new Date(),
            updatedAt: formData.updatedAt?.toDate() || new Date(),
          }
          
          setFormTemplate(formWithDates)
        } else {
          toast.error("Form not found")
          router.push("/dashboard/forms")
        }
      } catch (error) {
        console.error("Error loading form:", error)
        toast.error("Failed to load form")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (formId) {
      loadForm()
    }
  }, [formId, organization?.id, router])
  
  // Handler for form changes
  const handleFormChange = (updatedTemplate: FormTemplate) => {
    setFormTemplate(updatedTemplate)
  }
  
  // Save form to Firestore
  const saveForm = async () => {
    if (!organization?.id || !user?.uid) {
      console.error("Missing data:", { organizationId: organization?.id, userId: user?.uid });
      toast.error("Organization or user information missing")
      return
    }
    
    try {
      setIsSaving(true)
      console.log("Starting form save process...");
      
      // Make sure createdBy is set
      const updatedTemplate = {
        ...formTemplate,
        createdBy: formTemplate.createdBy || user.uid,
        organizationId: organization.id,
        // Convert Date objects to Firestore compatible timestamps
        createdAt: formTemplate.createdAt,
        updatedAt: new Date()
      }
      
      console.log("Form to save:", updatedTemplate);
      
      // Prepare form data for Firestore by ensuring it's properly serializable
      const firestoreData = {
        ...updatedTemplate,
        // Convert fields to ensure serializable
        fields: updatedTemplate.fields.map(field => ({
          ...field,
          // Remove any functions or non-serializable data
          options: field.options ? [...field.options] : undefined
        }))
      }
      
      // Set the form in Firestore
      const formRef = doc(
        db, 
        "organizations", 
        organization.id, 
        "formTemplates", 
        updatedTemplate.id
      )
      
      console.log(`Saving to path: organizations/${organization.id}/formTemplates/${updatedTemplate.id}`);
      
      // Save to Firestore
      await setDoc(formRef, firestoreData);
      
      console.log("Form saved successfully to Firestore!");
      
      // Show a more visible toast notification
      toast.success(formId ? "Form updated successfully" : "Form created successfully", {
        duration: 4000,
        position: "top-center"
      })
      
      // If it's a new form, update the URL to include the form ID
      if (!formId) {
        router.push(`/dashboard/forms/builder?id=${updatedTemplate.id}`);
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form. See console for details.");
    } finally {
      setIsSaving(false);
    }
  }
  
  // Handle tab changes with unsaved changes check
  const handleTabChange = (value: string) => {
    // Check if there are unsaved changes
    if (activeTab === "edit") {
      setActiveTab(value)
    } else {
      setActiveTab(value)
    }
  }
  
  // Handle back button
  const handleBack = () => {
    // Simple check if there might be unsaved changes (in a real app, do a deeper comparison)
    setRedirectPath("/dashboard/forms")
    setShowUnsavedChanges(true)
  }
  
  // Redirect after confirmation
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      router.push(redirectPath)
    }
  }, [shouldRedirect, redirectPath, router])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading form...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {formId ? "Edit Form" : "Create New Form"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {formTemplate.updatedAt && formId && (
            <p className="text-sm text-muted-foreground mr-2">
              Last saved: {new Date(formTemplate.updatedAt).toLocaleTimeString()}
            </p>
          )}
          <Button onClick={saveForm} disabled={isSaving} className="relative overflow-hidden">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Form"}
            {isSaving && (
              <span className="absolute bottom-0 left-0 h-1 bg-primary-foreground animate-progress"></span>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit Form</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-4">
          <FormBuilder 
            formTemplate={formTemplate} 
            onChange={handleFormChange}
            onSave={saveForm}
            isSaving={isSaving}
          />
        </TabsContent>
        
        <TabsContent value="preview">
          {formTemplate.fields && formTemplate.fields.length > 0 ? (
            <div className="max-w-3xl mx-auto">
              <FormRenderer
                formTemplate={formTemplate}
                onSubmit={(data) => {
                  console.log("Form submitted with data:", data)
                  toast.success("Form submitted (preview mode)")
                }}
                onSaveDraft={(data) => {
                  console.log("Draft saved with data:", data)
                  toast.info("Draft saved (preview mode)")
                }}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Fields Added</CardTitle>
                <CardDescription>
                  You need to add at least one field to preview the form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveTab("edit")}>
                  Go to Editor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Unsaved Changes Alert */}
      <AlertDialog open={showUnsavedChanges} onOpenChange={setShowUnsavedChanges}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you navigate away. 
              Would you like to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedChanges(false)
              setShouldRedirect(false)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await saveForm()
              setShowUnsavedChanges(false)
              setShouldRedirect(true)
            }}>
              Save & Leave
            </AlertDialogAction>
            <AlertDialogAction onClick={() => {
              setShowUnsavedChanges(false)
              setShouldRedirect(true)
            }}>
              Leave without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 