"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AlertTriangle, Loader2, Upload } from "lucide-react"

export default function HazardRecognitionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [jobNumber, setJobNumber] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [recognizedEmployee, setRecognizedEmployee] = useState("")
  const [severity, setSeverity] = useState<string>("minor")
  const [potentialOutcome, setPotentialOutcome] = useState("")
  const [preventiveMeasures, setPreventiveMeasures] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setImages(fileArray)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a hazard recognition form.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would upload images to Firebase Storage
      // and get the download URLs to store in Firestore

      // For this example, we'll just simulate the image upload
      const imageUrls = images.length > 0 ? ["https://example.com/placeholder-image.jpg"] : []

      // Create hazard recognition document in Firestore
      await addDoc(collection(db, "employeeRecognition"), {
        type: "hazard-recognition",
        reportedBy: user.id,
        reportedByName: user.displayName,
        reportedAt: serverTimestamp(),
        jobNumber,
        location,
        description,
        recognizedEmployee,
        severity,
        potentialOutcome,
        preventiveMeasures,
        images: imageUrls,
        status: "new",
      })

      toast({
        title: "Hazard recognition submitted successfully",
        description: "Thank you for your contribution to workplace safety!",
      })

      router.push("/")
    } catch (error) {
      console.error("Error submitting hazard recognition:", error)
      toast({
        title: "Error submitting form",
        description: "There was a problem submitting your form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl p-4 pb-20 md:p-8 md:pb-8">
        <Card>
          <CardHeader className="bg-blue-800 text-white">
            <CardTitle className="flex items-center justify-center text-2xl">
              <AlertTriangle className="mr-2 h-6 w-6" />
              Hazard Recognition
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="jobNumber">Job Number</Label>
                  <Input
                    id="jobNumber"
                    value={jobNumber}
                    onChange={(e) => setJobNumber(e.target.value)}
                    placeholder="Enter job number"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location where hazard was identified"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description of Hazard</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the hazard in detail"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="recognizedEmployee">Employee Being Recognized (Optional)</Label>
                  <Input
                    id="recognizedEmployee"
                    value={recognizedEmployee}
                    onChange={(e) => setRecognizedEmployee(e.target.value)}
                    placeholder="Enter name of employee being recognized"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="potentialOutcome">Potential Outcome</Label>
                  <Textarea
                    id="potentialOutcome"
                    value={potentialOutcome}
                    onChange={(e) => setPotentialOutcome(e.target.value)}
                    placeholder="What could have happened if this hazard wasn't addressed?"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="preventiveMeasures">Preventive Measures</Label>
                  <Textarea
                    id="preventiveMeasures"
                    value={preventiveMeasures}
                    onChange={(e) => setPreventiveMeasures(e.target.value)}
                    placeholder="What measures were taken or should be taken to address this hazard?"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="images">Upload Images (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="images"
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Upload className="h-4 w-4" />
                      {images.length > 0 ? `${images.length} file(s) selected` : "Choose files"}
                    </Label>
                    {images.length > 0 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setImages([])}>
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Upload images of the hazard to help with assessment.</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Recognition"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

