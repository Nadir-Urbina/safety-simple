"use client"

import { useState, useEffect } from "react"
import { Image as ImageIcon, FileText, ExternalLink, ArrowLeft } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { FormTemplate, FormSubmission } from "@/src/types/forms"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toDate } from '@/lib/firebase-utils'

export default function ViewSubmissionPage({ params }: { params: { id: string } }) {
  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { organization } = useOrganization()
  const router = useRouter()
  const submissionId = params.id
  
  useEffect(() => {
    const loadSubmission = async () => {
      if (!submissionId || !organization?.id) {
        setError("Submission not found")
        setIsLoading(false)
        return
      }
      
      try {
        const submissionRef = doc(db, "organizations", organization.id, "formSubmissions", submissionId)
        const submissionDoc = await getDoc(submissionRef)
        
        if (submissionDoc.exists()) {
          const submissionData = submissionDoc.data()
          
          setSubmission({
            ...submissionData,
            id: submissionDoc.id,
            submittedAt: toDate(submissionData.submittedAt) || new Date(),
            lastUpdatedAt: toDate(submissionData.lastUpdatedAt) || new Date()
          } as FormSubmission)
        } else {
          setError("Submission not found")
        }
      } catch (err) {
        console.error("Error loading submission:", err)
        setError("Failed to load submission")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSubmission()
  }, [submissionId, organization?.id])
  
  const handleBack = () => {
    router.push("/dashboard/forms/submissions")
  }
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent" />
        </div>
      </div>
    )
  }
  
  if (error || !submission) {
    return (
      <div className="container py-8">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error || "Submission not found"}
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-8">
      <Button variant="outline" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Submissions
      </Button>
      
      <h1 className="text-2xl font-bold mb-4">Submission Details</h1>
      
      {/* Submission details */}
      <div className="bg-card p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Form Values</h2>
        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
          {JSON.stringify(submission.values, null, 2)}
        </pre>
      </div>
      
      {/* Render file attachments if available */}
      {submission.attachments && submission.attachments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Attachments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submission.attachments.map((url, index) => {
              const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null;
              
              if (isImage) {
                return (
                  <div key={index} className="relative group rounded-md overflow-hidden border">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <div className="aspect-video relative">
                        <img 
                          src={url} 
                          alt={`Attachment ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <ExternalLink className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50">
                        <span className="text-sm flex items-center">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Attachment {index + 1}
                        </span>
                      </div>
                    </a>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="border rounded-md p-4">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex flex-col gap-2"
                    >
                      <div className="h-24 flex items-center justify-center bg-muted/50 rounded">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">
                          Attachment {index + 1}
                        </span>
                        <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      </div>
                    </a>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  )
} 