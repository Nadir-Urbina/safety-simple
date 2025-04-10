"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { collection, query, getDocs, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { FormTemplate } from "@/src/types/forms"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormCard } from "@/components/ui/form-card"
import { toast } from "sonner"
import { Search, FileText, ClipboardCheck, AlertTriangle, Eye, Loader2 } from "lucide-react"
import { processFirestoreData } from "@/lib/firebase-utils"

export default function IncidentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [filteredForms, setFilteredForms] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Load incident forms from Firestore
  useEffect(() => {
    const loadForms = async () => {
      if (!organization?.id) return
      
      try {
        setIsLoading(true)
        
        const formTemplatesQuery = query(
          collection(db, "organizations", organization.id, "formTemplates"),
          where("category", "==", "incident"),
          where("isActive", "==", true),
          orderBy("createdAt", "desc")
        )
        
        const formTemplatesSnapshot = await getDocs(formTemplatesQuery)
        const incidentForms: FormTemplate[] = []
        
        formTemplatesSnapshot.forEach((doc) => {
          const formData = doc.data() as Omit<FormTemplate, "id">
          const processedData = processFirestoreData(formData)
          
          incidentForms.push({
            id: doc.id,
            ...processedData,
          })
        })
        
        setForms(incidentForms)
        setFilteredForms(incidentForms)
      } catch (error) {
        console.error("Error loading incident forms:", error)
        toast.error("Failed to load incident forms")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (organization?.id) {
      loadForms()
    }
  }, [organization?.id])
  
  // Handle search
  useEffect(() => {
    let filtered = [...forms]
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (form) =>
          form.name.toLowerCase().includes(query) ||
          form.description?.toLowerCase().includes(query)
      )
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (form) => form.category === selectedCategory
      )
    }
    
    setFilteredForms(filtered)
  }, [searchQuery, selectedCategory, forms])
  
  // Start form submission
  const startForm = (formId: string) => {
    router.push(`/dashboard/forms/view?id=${formId}`)
  }
  
  // Get specific categories from forms
  const getCategories = () => {
    const categories = new Set<string>()
    forms.forEach(form => {
      if (form.category) {
        categories.add(form.category)
      }
    })
    return Array.from(categories)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading incident forms...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6 px-4 md:px-6 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Submit an Incident Report</h1>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search forms..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <p className="text-muted-foreground">
          Select the appropriate form to document incidents, near misses, safety observations, and more.
        </p>
      </div>
      
      {/* Category filter buttons */}
      {getCategories().length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {getCategories().map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}
      
      {/* Forms grid */}
      {filteredForms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              icon={AlertTriangle}
              title={form.name}
              description={form.description || "No description provided"}
              category={form.category || "Incident"}
              iconColor={"text-red-500"}
              iconBgColor={"bg-red-100"}
              buttonText="Start Report"
              href={`/dashboard/forms/view?id=${form.id}`}
            >
              <p className="text-sm text-muted-foreground">
                Use this form to report and document incidents according to your organization's protocols.
              </p>
            </FormCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No incident forms found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery.trim() !== "" 
              ? "Try adjusting your search or filters" 
              : "There are no incident report forms available for your organization"}
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery("")
            setSelectedCategory(null)
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
} 