"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { FormTemplate, FormSubmission, SubmissionStatus } from "@/types/forms"
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
          
          if (!formWithDates.isActive) {
            setFormError("This form is no longer active")
          }
          
          setForm(formWithDates)
        } else {
          setFormError("Form not found")
        }
      } catch (error) {
        console.error("Error loading form:", error)
        setFormError("Failed to load form")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadForm()
  }, [formId, organization?.id])
  
  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    if (!user || !organization?.id || !form) {
      toast.error("Authentication or organization information missing")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Create submission object
      const submission: FormSubmission = {
        id: uuidv4(),
        formTemplateId: form.id,
        organizationId: organization.id,
        submittedBy: user.uid,
        submittedAt: new Date(),
        status: "submitted" as SubmissionStatus,
        values: formData
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
        organizationId: organization.id,
        submittedBy: user.uid,
        submittedAt: new Date(),
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