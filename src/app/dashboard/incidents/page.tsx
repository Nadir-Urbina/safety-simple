"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, getDocs, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useOrganization } from "@/contexts/organization-context"
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
import { 
  AlertTriangle, 
  Car, 
  ClipboardList, 
  Edit, 
  FileText, 
  AlertCircle,
  HardHat,
  Thermometer,
  Search,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toDate } from '@/lib/firebase-utils'
import { toast } from "sonner"

export default function IncidentsPage() {
  const router = useRouter()
  const { organization } = useOrganization()
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [filteredForms, setFilteredForms] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [incidents, setIncidents] = useState<any[]>([])
  
  // Load published forms
  useEffect(() => {
    const loadPublishedForms = async () => {
      if (!organization?.id) return
      
      try {
        setIsLoading(true)
        const formsRef = collection(db, "organizations", organization.id, "formTemplates")
        const formsQuery = query(formsRef, where("isActive", "==", true))
        const formsSnapshot = await getDocs(formsQuery)
        
        const formsList: FormTemplate[] = []
        formsSnapshot.forEach((doc) => {
          const formData = doc.data() as FormTemplate
          formsList.push({
            ...formData,
            id: doc.id,
            createdAt: toDate(formData.createdAt) || new Date(),
            updatedAt: toDate(formData.updatedAt) || new Date()
          })
        })
        
        setForms(formsList)
        setFilteredForms(formsList)
      } catch (error) {
        console.error("Error loading forms:", error)
        toast.error("Failed to load forms")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (organization?.id) {
      loadPublishedForms()
    }
  }, [organization?.id])
  
  // Load incidents
  useEffect(() => {
    const loadIncidents = async () => {
      if (!organization?.id) return;
      
      try {
        setIsLoading(true);
        const incidentsRef = collection(db, "organizations", organization.id, "incidents");
        const q = query(incidentsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const incidentsList: any[] = [];
        querySnapshot.forEach((doc) => {
          const formData = doc.data();
          incidentsList.push({
            id: doc.id,
            ...formData,
            createdAt: toDate(formData.createdAt) || new Date(),
            updatedAt: toDate(formData.updatedAt) || new Date()
          });
        });
        
        setIncidents(incidentsList);
      } catch (error) {
        console.error("Error loading incidents:", error);
        toast.error("Failed to load incidents");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIncidents();
  }, [organization?.id]);
  
  // Filter forms based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredForms(getFilteredFormsByCategory())
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = forms.filter(
        (form) => form.name.toLowerCase().includes(query) || 
                  form.description?.toLowerCase().includes(query)
      )
      setFilteredForms(filtered)
    }
  }, [searchQuery, forms, activeTab])
  
  // Filter forms by category based on active tab
  const getFilteredFormsByCategory = () => {
    if (activeTab === "all") {
      return forms
    } else {
      return forms.filter(form => form.category === activeTab)
    }
  }
  
  // Update filtered forms when tab changes
  useEffect(() => {
    setFilteredForms(getFilteredFormsByCategory())
  }, [activeTab, forms])
  
  // Get category badge and icon
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "incident":
        return { 
          badge: <Badge variant="destructive">Incident Report</Badge>,
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />
        }
      case "nearMiss":
        return { 
          badge: <Badge variant="warning">Near Miss</Badge>,
          icon: <AlertCircle className="h-12 w-12 text-amber-500" />
        }
      case "vehicleAccident":
        return { 
          badge: <Badge variant="destructive">Vehicle Accident</Badge>,
          icon: <Car className="h-12 w-12 text-blue-600" />
        }
      case "safety":
        return { 
          badge: <Badge variant="outline" className="border-green-500 text-green-700">Safety Observation</Badge>,
          icon: <HardHat className="h-12 w-12 text-green-600" />
        }
      case "heatPrevention":
        return { 
          badge: <Badge variant="warning">Heat Prevention</Badge>,
          icon: <Thermometer className="h-12 w-12 text-orange-500" />
        }
      case "recognition":
        return { 
          badge: <Badge variant="success">Recognition</Badge>,
          icon: <FileText className="h-12 w-12 text-indigo-500" />
        }
      default:
        return { 
          badge: <Badge variant="secondary">Other</Badge>,
          icon: <ClipboardList className="h-12 w-12 text-slate-500" />
        }
    }
  }
  
  const handleStartForm = (formId: string) => {
    router.push(`/dashboard/forms/view?id=${formId}`)
  }
  
  // Route to Heat JSA form
  const handleHeatJSA = () => {
    router.push('/heat/check-weather')
  }
  
  // Default forms for demonstration (would be replaced by actual forms)
  const defaultForms = [
    {
      id: "heat-jsa",
      name: "Heat Illness Prevention JSA",
      description: "Submit a Job Safety Analysis for heat-related work conditions",
      category: "heatPrevention"
    }
  ]
  
  // Show built-in forms alongside custom forms
  const combinedForms = [
    ...defaultForms,
    ...filteredForms
  ]

  return (
    <div className="container py-6">
      <div className="flex flex-col items-center justify-center mb-8 py-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Submit an Incident Report</h1>
        <p className="text-center max-w-2xl opacity-90">
          Select the appropriate form to document incidents, near misses, safety observations, and more.
        </p>
      </div>
      
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
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="incident">Incidents</TabsTrigger>
            <TabsTrigger value="vehicleAccident">Vehicle</TabsTrigger>
            <TabsTrigger value="nearMiss">Near Miss</TabsTrigger>
            <TabsTrigger value="heatPrevention">Heat</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : combinedForms.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-md">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No forms available</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {searchQuery
              ? "No forms match your search criteria."
              : "There are no published forms available."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Heat JSA Card (Always show this card) */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white pb-3">
              <div className="flex justify-between">
                <CardTitle>Heat Illness Prevention JSA</CardTitle>
                <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                  Required
                </Badge>
              </div>
              <CardDescription className="text-white/90">
                Check weather conditions and complete a JSA
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex items-center">
              <div className="flex-shrink-0 mr-4">
                <Thermometer className="h-12 w-12 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Check current heat index, get precautions based on risk level, and document compliance 
                  with your heat illness prevention program.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4 pb-2">
              <Button onClick={handleHeatJSA}>
                Start JSA
              </Button>
            </CardFooter>
          </Card>
          
          {/* Custom Form Cards */}
          {filteredForms.map((form) => {
            const { badge, icon } = getCategoryInfo(form.category)
            return (
              <Card key={form.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <CardTitle>{form.name}</CardTitle>
                    {badge}
                  </div>
                  <CardDescription>
                    {form.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {form.description || "Use this form to report and document incidents according to your organization's protocols."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4 pb-2">
                  <Button onClick={() => handleStartForm(form.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Start Report
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 