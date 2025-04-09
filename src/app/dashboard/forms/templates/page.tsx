"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc,
  increment,
  serverTimestamp
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SystemFormTemplate, IndustryType, ComplexityLevel, FormField } from "@/src/types/forms"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  Search, 
  BookCopy, 
  AlertTriangle, 
  Award, 
  Thermometer, 
  FileText,
  Clock,
  Building,
  ActivitySquare,
  Eye,
  CheckCircle2,
  Filter
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import { seedSystemTemplates } from "@/scripts/seed-system-templates"
import { toDate } from "@/lib/firebase-utils"

export default function TemplateLibraryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { organization } = useOrganization()
  
  const [templates, setTemplates] = useState<SystemFormTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<SystemFormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all")
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all")
  const [selectedTemplate, setSelectedTemplate] = useState<SystemFormTemplate | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showCopyConfirmDialog, setShowCopyConfirmDialog] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  
  // Load system form templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true)
        
        const templatesRef = collection(db, "systemFormTemplates")
        const q = query(templatesRef)
        const querySnapshot = await getDocs(q)
        
        const templatesList: SystemFormTemplate[] = []
        querySnapshot.forEach((doc) => {
          const templateData = doc.data() as SystemFormTemplate
          // Convert Firestore timestamps to Date objects
          templatesList.push({
            ...templateData,
            id: doc.id,
            createdAt: toDate(templateData.createdAt) || new Date(),
            updatedAt: toDate(templateData.updatedAt) || new Date(),
          })
        })
        
        // Sort by most used or recently updated
        templatesList.sort((a, b) => b.usageCount - a.usageCount)
        
        setTemplates(templatesList)
        setFilteredTemplates(templatesList)
      } catch (error) {
        console.error("Error loading templates:", error)
        toast.error("Failed to load template library")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTemplates()
  }, [])
  
  // Apply all filters
  useEffect(() => {
    let filtered = [...templates]
    
    // Filter by category (tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(template => template.category === activeTab)
    }
    
    // Filter by industry
    if (selectedIndustry !== "all") {
      filtered = filtered.filter(template => 
        template.industries.includes(selectedIndustry as IndustryType)
      )
    }
    
    // Filter by complexity
    if (selectedComplexity !== "all") {
      filtered = filtered.filter(template => 
        template.complexity === selectedComplexity as ComplexityLevel
      )
    }
    
    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        template =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query)
      )
    }
    
    setFilteredTemplates(filtered)
  }, [templates, activeTab, selectedIndustry, selectedComplexity, searchQuery])
  
  // View template preview
  const previewTemplate = (template: SystemFormTemplate) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }
  
  // Copy template to organization
  const copyTemplateToOrganization = async () => {
    if (!selectedTemplate || !organization?.id || !user?.uid) {
      toast.error("Unable to copy template. Missing required information.")
      return
    }
    
    try {
      setIsCopying(true)
      
      // Create a new form template based on the system template
      const newFormTemplate = {
        id: uuidv4(),
        organizationId: organization.id,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        category: selectedTemplate.category,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid,
        isActive: true,
        fields: JSON.parse(JSON.stringify(selectedTemplate.fields)), // Deep copy fields
        version: 1,
        isLatestVersion: true,
        copiedFromTemplateId: selectedTemplate.id
      }
      
      // Add new form template to organization
      await setDoc(
        doc(db, "organizations", organization.id, "formTemplates", newFormTemplate.id), 
        newFormTemplate
      )
      
      // Update usage count for the system template
      const templateRef = doc(db, "systemFormTemplates", selectedTemplate.id)
      await updateDoc(templateRef, {
        usageCount: increment(1),
        updatedAt: serverTimestamp()
      })
      
      toast.success("Template copied successfully to your organization!")
      setShowCopyConfirmDialog(false)
      setShowPreviewDialog(false)
      
      // Redirect to the forms list page
      router.push("/dashboard/forms")
    } catch (error) {
      console.error("Error copying template:", error)
      toast.error("Failed to copy template")
    } finally {
      setIsCopying(false)
    }
  }
  
  // Get category badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "incident":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Incident
          </Badge>
        )
      case "recognition":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            Recognition
          </Badge>
        )
      case "heatPrevention":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            Heat Prevention
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Other
          </Badge>
        )
    }
  }
  
  // Get complexity badge
  const getComplexityBadge = (complexity: ComplexityLevel) => {
    switch (complexity) {
      case "basic":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Basic</Badge>
      case "intermediate":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Intermediate</Badge>
      case "advanced":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Advanced</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }
  
  // Get industry badge
  const getIndustryBadge = (industry: IndustryType) => {
    const industryLabels: Record<IndustryType, string> = {
      construction: "Construction",
      manufacturing: "Manufacturing",
      transportation: "Transportation",
      healthcare: "Healthcare",
      general: "General",
      utilities: "Utilities",
      mining: "Mining",
      oil_and_gas: "Oil & Gas",
      agriculture: "Agriculture"
    }
    
    return (
      <Badge key={industry} variant="outline" className="bg-gray-50 mr-1 mb-1">
        {industryLabels[industry]}
      </Badge>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading template library...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Form Template Library</h1>
          <p className="text-muted-foreground">
            Browse and copy pre-built templates to your organization
          </p>
        </div>
        
        {/* Add admin button to seed templates */}
        {user?.role === "admin" && (
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                setIsLoading(true);
                const count = await seedSystemTemplates();
                if (count > 0) {
                  toast.success(`✅ Successfully added ${count} templates!`);
                  // Reload templates after seeding
                  window.location.reload();
                } else {
                  toast.info("No new templates were added. They might already exist.");
                }
              } catch (error) {
                console.error("Error seeding templates:", error);
                toast.error("Failed to seed templates");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <BookCopy className="h-4 w-4 mr-2" />
            Seed Template Library
          </Button>
        )}
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Browse Templates</CardTitle>
          <CardDescription>
            Find templates by category, industry, or complexity level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search templates..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="mining">Mining</SelectItem>
                  <SelectItem value="oil_and_gas">Oil & Gas</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Complexity Levels</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="incident">Incident</TabsTrigger>
              <TabsTrigger value="recognition">Recognition</TabsTrigger>
              <TabsTrigger value="heatPrevention">Heat Prevention</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-md">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      {getCategoryBadge(template.category)}
                      {getComplexityBadge(template.complexity)}
                    </div>
                    <CardTitle className="text-lg mt-2">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    
                    <div className="flex flex-wrap mt-2 mb-3">
                      {template.industries.map(industry => getIndustryBadge(industry))}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-4">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.estimatedCompletionTime} min
                      </div>
                      <div className="flex items-center">
                        <ActivitySquare className="h-3 w-3 mr-1" />
                        {template.fields.length} fields
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {template.usageCount} uses
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => previewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowCopyConfirmDialog(true)
                      }}
                    >
                      <BookCopy className="h-4 w-4 mr-2" />
                      Copy to My Forms
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Showing {filteredTemplates.length} of {templates.length} templates
        </CardFooter>
      </Card>
      
      {/* Template Preview Dialog */}
      {selectedTemplate && (
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate.name}
                {getCategoryBadge(selectedTemplate.category)}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center mr-4">
                  <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">Industries:</span>
                  <div className="ml-2 flex flex-wrap gap-1">
                    {selectedTemplate.industries.map(industry => getIndustryBadge(industry))}
                  </div>
                </div>
                
                <div className="flex items-center mr-4">
                  <ActivitySquare className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">Complexity:</span>
                  <div className="ml-2">
                    {getComplexityBadge(selectedTemplate.complexity)}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">Est. Completion Time:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.estimatedCompletionTime} min</span>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/50">
                <h3 className="font-medium mb-4">Form Fields ({selectedTemplate.fields.length})</h3>
                <div className="grid gap-4">
                  {selectedTemplate.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.id} className="border rounded-md p-3 bg-card">
                        <div className="flex justify-between">
                          <div className="font-medium">{field.label}</div>
                          <Badge variant="outline">{field.type}</Badge>
                        </div>
                        {field.helpText && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {field.helpText}
                          </p>
                        )}
                        {field.required && (
                          <Badge variant="secondary" className="mt-2">Required</Badge>
                        )}
                        
                        {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') && field.options && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-1">Options:</p>
                            <div className="flex flex-wrap gap-1">
                              {field.options.map((option, idx) => (
                                <Badge key={idx} variant="outline">{option.label}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowCopyConfirmDialog(true)
                  setShowPreviewDialog(false)
                }}
              >
                <BookCopy className="h-4 w-4 mr-2" />
                Copy to My Forms
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Copy Confirmation Dialog */}
      {selectedTemplate && (
        <Dialog open={showCopyConfirmDialog} onOpenChange={setShowCopyConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Copy Template to Your Forms</DialogTitle>
              <DialogDescription>
                This will create a copy of "{selectedTemplate.name}" in your organization's forms.
                You can edit it after copying.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm font-medium mb-2">
                Template will be copied with:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>{selectedTemplate.fields.length} form fields</li>
                <li>Marked as <Badge variant="secondary">Active</Badge></li>
                <li>Will be immediately available for users to submit</li>
              </ul>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCopyConfirmDialog(false)}
                disabled={isCopying}
              >
                Cancel
              </Button>
              <Button 
                onClick={copyTemplateToOrganization}
                disabled={isCopying}
              >
                {isCopying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Copying...
                  </>
                ) : (
                  <>
                    <BookCopy className="h-4 w-4 mr-2" />
                    Copy Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 