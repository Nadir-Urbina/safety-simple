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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useWeather } from "@/hooks/use-weather"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Thermometer, Loader2 } from "lucide-react"

interface PrecautionItem {
  id: string
  label: string
}

export default function SubmitJSAPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { weatherData, loading: weatherLoading } = useWeather()
  const [jobNumber, setJobNumber] = useState("")
  const [location, setLocation] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [selectedPrecautions, setSelectedPrecautions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Precautions based on heat index
  const getPrecautionItems = (): PrecautionItem[] => {
    const basePrecautions = [
      { id: "water", label: "Provide plenty of cool water (at least 1 quart per hour)" },
      { id: "shade", label: "Provide access to shade or cool area" },
      { id: "breaks", label: "Allow workers to take breaks as needed" },
      { id: "buddy", label: "Use buddy system to monitor workers" },
      { id: "training", label: "Provide heat illness prevention training" },
    ]

    const moderatePrecautions = [
      { id: "schedule", label: "Schedule heavy work during cooler parts of the day" },
      { id: "rotation", label: "Rotate workers to reduce heat exposure" },
      { id: "monitoring", label: "Increase monitoring of workers" },
    ]

    const highPrecautions = [
      { id: "cooling", label: "Provide cooling vests or other cooling equipment" },
      { id: "reduced-work", label: "Reduce work load and increase rest periods" },
      { id: "medical", label: "Have medical services readily available" },
    ]

    const extremePrecautions = [
      { id: "reschedule", label: "Consider rescheduling non-essential tasks" },
      { id: "constant-monitoring", label: "Constant monitoring of workers" },
      { id: "emergency-plan", label: "Review emergency response procedures" },
    ]

    if (!weatherData) return basePrecautions

    const heatIndex = weatherData.heatIndex

    if (heatIndex < 80) return basePrecautions
    if (heatIndex < 91) return [...basePrecautions, ...moderatePrecautions]
    if (heatIndex < 103) return [...basePrecautions, ...moderatePrecautions, ...highPrecautions]
    return [...basePrecautions, ...moderatePrecautions, ...highPrecautions, ...extremePrecautions]
  }

  const handlePrecautionChange = (precautionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPrecautions([...selectedPrecautions, precautionId])
    } else {
      setSelectedPrecautions(selectedPrecautions.filter((id) => id !== precautionId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a JSA form.",
        variant: "destructive",
      })
      return
    }

    if (!weatherData) {
      toast({
        title: "Weather data required",
        description: "Please check the weather before submitting a JSA form.",
        variant: "destructive",
      })
      router.push("/heat/check-weather")
      return
    }

    if (selectedPrecautions.length === 0) {
      toast({
        title: "Precautions required",
        description: "Please select at least one precaution.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get the precaution labels for the selected IDs
      const precautionItems = getPrecautionItems()
      const precautionLabels = selectedPrecautions.map((id) => {
        const item = precautionItems.find((item) => item.id === id)
        return item ? item.label : id
      })

      // Create JSA document in Firestore
      await addDoc(collection(db, "heatJSA"), {
        reportedBy: user.id,
        reportedByName: user.displayName,
        reportedAt: serverTimestamp(),
        jobNumber,
        location,
        weatherData: {
          temperature: weatherData.temperature,
          heatIndex: weatherData.heatIndex,
          uvIndex: weatherData.uvIndex,
          conditions: weatherData.conditions,
          location: weatherData.location,
          timestamp: weatherData.timestamp,
        },
        precautionsTaken: precautionLabels,
        additionalNotes,
        status: "submitted",
      })

      toast({
        title: "JSA submitted successfully",
        description: "Your Heat Illness Prevention JSA has been submitted.",
      })

      router.push("/")
    } catch (error) {
      console.error("Error submitting JSA:", error)
      toast({
        title: "Error submitting JSA",
        description: "There was a problem submitting your JSA. Please try again.",
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
          <CardHeader className="bg-amber-500 text-white">
            <CardTitle className="flex items-center justify-center text-2xl">
              <Thermometer className="mr-2 h-6 w-6" />
              Heat Illness Prevention JSA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!weatherData && !weatherLoading ? (
              <div className="text-center">
                <p className="mb-4 text-lg">Please check the weather before submitting a JSA form.</p>
                <Button onClick={() => router.push("/heat/check-weather")} className="bg-cyan-600 hover:bg-cyan-700">
                  Check Weather
                </Button>
              </div>
            ) : weatherLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-md bg-blue-50 p-4">
                  <h3 className="mb-4 text-center text-lg font-semibold text-blue-800">Current Weather Conditions</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-right font-medium">Temperature:</div>
                    <div>{weatherData?.temperature}°F</div>

                    <div className="text-right font-medium">Heat Index:</div>
                    <div>{weatherData?.heatIndex}</div>

                    <div className="text-right font-medium">UV Index:</div>
                    <div>{weatherData?.uvIndex}</div>

                    <div className="text-right font-medium">Conditions:</div>
                    <div>{weatherData?.conditions}</div>

                    <div className="text-right font-medium">Location:</div>
                    <div>{weatherData?.location}</div>
                  </div>
                </div>

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
                    <Label htmlFor="location">Work Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter work location"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Precautions Being Taken</h3>
                  <p className="text-sm text-muted-foreground">
                    Select all precautions that are being implemented at your work site:
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {getPrecautionItems().map((item) => (
                      <div key={item.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={item.id}
                          checked={selectedPrecautions.includes(item.id)}
                          onCheckedChange={(checked) => handlePrecautionChange(item.id, checked as boolean)}
                        />
                        <Label htmlFor={item.id} className="text-sm font-normal leading-tight">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Enter any additional information or notes"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit JSA"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

