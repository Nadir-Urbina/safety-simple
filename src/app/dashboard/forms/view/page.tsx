"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { FormTemplate, FormSubmission, SubmissionStatus } from "@/src/types/forms"
import { FormRenderer } from "@/components/forms/form-renderer"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, ClipboardCheck, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { v4 as uuidv4 } from "uuid"
import { uploadFile, getFormSubmissionAttachmentPath } from "@/src/lib/upload"
import { toDate } from '@/lib/firebase-utils'

export default function ViewFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  const formId = searchParams.get("id")
  const [form, setForm] = useState<FormTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionComplete, setSubmissionComplete] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Load the form template
  useEffect(() => {
    const loadForm = async () => {
      if (!formId || !organization?.id) {
        setFormError("Form not found or you don't have access")
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const formRef = doc(db, "organizations", organization.id, "formTemplates", formId)
        const formDoc = await getDoc(formRef)
        
        if (formDoc.exists()) {
          // Get the raw document data
          const rawFormData = formDoc.data();
          
          // Create a properly typed FormTemplate object
          const formTemplate: FormTemplate = {
            id: formDoc.id,
            // Spread all the raw data first
            ...rawFormData,
            // Override with properly handled timestamps
            createdAt: toDate(rawFormData.createdAt) || new Date(),
            updatedAt: toDate(rawFormData.updatedAt) || new Date(),
            // Ensure all required fields are present with defaults if needed
            organizationId: rawFormData.organizationId || organization.id,
            name: rawFormData.name || 'Untitled Form',
            category: rawFormData.category || 'other',
            createdBy: rawFormData.createdBy || user?.uid || 'unknown',
            fields: rawFormData.fields || [],
            isActive: rawFormData.isActive !== undefined ? rawFormData.isActive : true,
            version: rawFormData.version || 1,
            isLatestVersion: rawFormData.isLatestVersion !== undefined ? rawFormData.isLatestVersion : true
          };
          
          setForm(formTemplate);
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
    
    loadForm()
  }, [formId, organization?.id, router])
  
  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    if (!user || !organization?.id || !form) {
      toast.error("Authentication or organization information missing")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Process file uploads and replace file objects with download URLs
      const processedFormData = { ...formData }
      const fileUploadPromises: Promise<string>[] = []
      const fileAttachmentUrls: string[] = []
      
      // Process each field to find file uploads
      for (const fieldId in formData) {
        const fieldValue = formData[fieldId]
        const field = form.fields?.find(f => f.id === fieldId)
        
        // Handle file uploads for file type fields
        if (field?.type === 'file' && fieldValue && fieldValue.file) {
          const submissionId = uuidv4() // Generate ID for the submission
          
          // Create a path for the file in Firebase Storage
          const path = getFormSubmissionAttachmentPath(
            organization.id,
            form.id,
            submissionId
          )
          
          // Create a promise to upload the file
          const uploadPromise = uploadFile(fieldValue.file, path)
            .then(downloadUrl => {
              // Store the download URL in the processed form data
              processedFormData[fieldId] = downloadUrl
              // Also add to the attachments array
              fileAttachmentUrls.push(downloadUrl)
              return downloadUrl
            })
          
          fileUploadPromises.push(uploadPromise)
        }
      }
      
      // Wait for all file uploads to complete
      if (fileUploadPromises.length > 0) {
        await Promise.all(fileUploadPromises)
      }
      
      // Create submission object
      const submission: FormSubmission = {
        id: uuidv4(),
        formTemplateId: form.id,
        formVersion: form.version || 1,
        organizationId: organization.id,
        submittedBy: user?.uid || 'anonymous',
        submittedAt: new Date(),
        lastUpdatedAt: new Date(),
        status: "submitted" as SubmissionStatus,
        values: processedFormData,
        attachments: fileAttachmentUrls.length > 0 ? fileAttachmentUrls : undefined
      }
      
      // Save to Firestore
      const submissionsRef = collection(
        db, 
        "organizations", 
        organization.id, 
        "formSubmissions"
      )
      
      await addDoc(submissionsRef, submission)
      
      setSubmissionComplete(true)
      toast.success("Form submitted successfully")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to submit form")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle saving draft
  const handleSaveDraft = async (formData: Record<string, any>) => {
    if (!user || !organization?.id || !form) {
      toast.error("Authentication or organization information missing")
      return
    }
    
    try {
      // Create draft submission
      const draftSubmission: FormSubmission = {
        id: uuidv4(),
        formTemplateId: form.id,
        formVersion: form.version || 1,
        organizationId: organization.id,
        submittedBy: user?.uid || 'anonymous',
        submittedAt: new Date(),
        lastUpdatedAt: new Date(),
        status: "draft" as SubmissionStatus,
        values: formData
      }
      
      // Save to Firestore
      const draftsRef = collection(
        db, 
        "organizations", 
        organization.id, 
        "formDrafts"
      )
      
      await addDoc(draftsRef, draftSubmission)
      
      toast.success("Draft saved successfully")
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    }
  }
  
  // Handle going back
  const handleBack = () => {
    router.push("/dashboard/forms")
  }
  
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
  
  if (formError || !form) {
    return (
      <div className="container py-6">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms
        </Button>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError || "Form not available"}</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (submissionComplete) {
    return (
      <div className="container py-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <ClipboardCheck className="mr-2 h-6 w-6" />
                Submission Successful
              </CardTitle>
              <CardDescription>
                Your form has been submitted successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Thank you for your submission. Your response has been recorded.
              </p>
              <div className="flex gap-4">
                <Button onClick={handleBack}>
                  Return to Forms
                </Button>
                <Button variant="outline" onClick={() => setSubmissionComplete(false)}>
                  Submit Another Response
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleBack}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{form.name}</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <FormRenderer
          formTemplate={form}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
} 