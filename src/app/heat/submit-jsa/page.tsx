"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useWeather } from "../../../../contexts/weather-context"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Thermometer, Loader2, AlertTriangle, ChevronRight } from "lucide-react"
import { HeatThreshold } from "@/src/types"

export default function SubmitJSAPage() {
  const { user } = useAuth()
  const { organization } = useOrganization()
  const router = useRouter()
  const { toast } = useToast()
  const { weatherData, forecast, loading: weatherLoading } = useWeather()
  const [jobNumber, setJobNumber] = useState("")
  const [location, setLocation] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [selectedPrecautions, setSelectedPrecautions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [thresholds, setThresholds] = useState<HeatThreshold[]>([])
  const [thresholdsLoading, setThresholdsLoading] = useState(true)
  const [maxPredictedHeatIndex, setMaxPredictedHeatIndex] = useState<number | null>(null)

  // Load thresholds from organization settings
  useEffect(() => {
    const fetchThresholds = async () => {
      if (!organization?.id) return;
      
      setThresholdsLoading(true);
      try {
        const settingsDoc = await getDoc(doc(db, "organizations", organization.id, "settings", "heatPrevention"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.thresholds && Array.isArray(data.thresholds)) {
            setThresholds(data.thresholds);
          }
        } else {
          // Use default thresholds
          setThresholds([
            {
              id: "low",
              name: "Low Risk",
              minHeatIndex: 0,
              maxHeatIndex: 90,
              color: "green",
              precautions: ["Normal safety precautions, no special requirements"]
            },
            {
              id: "moderate",
              name: "Moderate Risk",
              minHeatIndex: 91,
              maxHeatIndex: 100,
              color: "yellow",
              precautions: ["Frequent water breaks", "Use buddy system", "Take regular rest periods"]
            },
            {
              id: "high",
              name: "High Risk",
              minHeatIndex: 101,
              maxHeatIndex: 115,
              color: "orange",
              precautions: ["Mandatory cooling breaks", "Increased water consumption", "Consider adjusting work hours"]
            },
            {
              id: "extreme",
              name: "Extreme Risk",
              minHeatIndex: 116,
              color: "red",
              precautions: ["Consider rescheduling work", "Limit physical exertion", "Constant monitoring for heat illness"]
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching heat prevention thresholds:", err);
        toast({
          title: "Error",
          description: "Failed to load heat prevention settings",
          variant: "destructive",
        });
      } finally {
        setThresholdsLoading(false);
      }
    };

    fetchThresholds();
  }, [organization?.id, toast]);

  const getHeatIndexCategory = (heatIndex: number): HeatThreshold => {
    // Sort thresholds by minHeatIndex to ensure proper order
    const sortedThresholds = [...thresholds].sort((a, b) => a.minHeatIndex - b.minHeatIndex);
    
    // Find the applicable threshold
    for (let i = sortedThresholds.length - 1; i >= 0; i--) {
      if (heatIndex >= sortedThresholds[i].minHeatIndex) {
        return sortedThresholds[i];
      }
    }
    
    // Default to first threshold if none match (shouldn't happen)
    return sortedThresholds[0];
  };

  // Get a readable color version based on risk color
  const getContrastColor = (color: string): string => {
    switch (color) {
      case 'green': return '#007700'; // darker green
      case 'yellow': return '#AA7700'; // darker yellow/amber
      case 'orange': return '#CC5500'; // darker orange
      case 'red': return '#CC0000'; // darker red
      default: return '#000000';
    }
  };

  const handlePrecautionChange = (precaution: string, checked: boolean) => {
    if (checked) {
      setSelectedPrecautions([...selectedPrecautions, precaution])
    } else {
      setSelectedPrecautions(selectedPrecautions.filter((item) => item !== precaution))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a compliance form.",
        variant: "destructive",
      })
      return
    }

    if (!organization?.id) {
      toast({
        title: "Organization required",
        description: "You must be part of an organization to submit a compliance form.",
        variant: "destructive",
      })
      return;
    }

    if (!weatherData) {
      toast({
        title: "Weather data required",
        description: "Please check the weather before submitting a compliance form.",
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
      // Get the current heat index threshold
      const currentThreshold = getHeatIndexCategory(weatherData.heatIndex);
      
      // Create compliance document in Firestore
      await addDoc(collection(db, "heatComplianceRecords"), {
        organizationId: organization.id,
        submittedBy: user.id,
        submittedByName: user.displayName || user.email,
        jobNumber,
        location,
        weatherData: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          heatIndex: weatherData.heatIndex,
          predictedMaxHeatIndex: maxPredictedHeatIndex,
          uvIndex: weatherData.uvIndex,
          conditions: weatherData.conditions,
          location: weatherData.location,
          timestamp: weatherData.timestamp,
        },
        heatIndex: weatherData.heatIndex,
        predictedMaxHeatIndex: maxPredictedHeatIndex,
        highestHeatIndex: getHighestHeatIndex(),
        riskLevel: getHeatIndexCategory(getHighestHeatIndex()).name,
        precautionsRequired: getHeatIndexCategory(getHighestHeatIndex()).precautions,
        precautionsTaken: selectedPrecautions,
        additionalNotes,
        status: "submitted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      toast({
        title: "Compliance record submitted",
        description: "Your Heat Illness Prevention compliance record has been submitted.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error submitting compliance record:", error)
      toast({
        title: "Error submitting record",
        description: "There was a problem submitting your compliance record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get the highest heat index (current or predicted max) for safety evaluation
  const getHighestHeatIndex = (): number => {
    const currentHeatIndex = weatherData?.heatIndex || 0;
    return Math.max(currentHeatIndex, maxPredictedHeatIndex || 0);
  };

  // Add a useEffect to find today's maximum heat index when forecast changes
  useEffect(() => {
    if (forecast && forecast.length > 0) {
      // Get today's date string
      const today = new Date().toISOString().split('T')[0];
      
      // Find today's forecast
      const todayForecast = forecast.find(day => 
        new Date(day.date).toISOString().split('T')[0] === today
      );
      
      if (todayForecast) {
        setMaxPredictedHeatIndex(todayForecast.maxHeatIndex);
      }
    }
  }, [forecast]);

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl p-4 pb-20 md:p-8 md:pb-8">
        <Card>
          <CardHeader className="bg-amber-500 text-white py-4 md:py-6">
            <CardTitle className="flex items-center justify-center text-xl md:text-2xl">
              <Thermometer className="mr-2 h-5 w-5 md:h-6 md:w-6" />
              Heat Illness Prevention Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {!weatherData && !weatherLoading ? (
              <div className="text-center">
                <p className="mb-4 text-lg">Please check the weather before submitting a compliance form.</p>
                <Button onClick={() => router.push("/heat/check-weather")} className="bg-cyan-600 hover:bg-cyan-700">
                  Check Weather
                </Button>
              </div>
            ) : weatherLoading || thresholdsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {!organization?.id && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Not Connected</AlertTitle>
                    <AlertDescription>
                      You must be logged in and connected to an organization to submit a compliance record.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="rounded-md bg-blue-50 p-3 md:p-4">
                  <h3 className="mb-3 text-center text-base md:text-lg font-semibold text-blue-800">Current Weather Conditions</h3>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-sm md:text-base">
                    <div className="text-right font-medium">Temperature:</div>
                    <div>{weatherData?.temperature}°F</div>

                    <div className="text-right font-medium">Humidity:</div>
                    <div>{weatherData?.humidity}%</div>

                    <div className="text-right font-medium">Current Heat Index:</div>
                    <div style={{ 
                      color: getContrastColor(getHeatIndexCategory(weatherData?.heatIndex || 0).color)
                    }}>
                      {weatherData?.heatIndex}°F
                      <span className="ml-1 font-medium">
                        ({getHeatIndexCategory(weatherData?.heatIndex || 0).name})
                      </span>
                    </div>

                    <div className="text-right font-medium">Predicted Max Heat Index:</div>
                    <div style={{ 
                      color: getContrastColor(getHeatIndexCategory(maxPredictedHeatIndex || 0).color)
                    }}>
                      {maxPredictedHeatIndex || "N/A"}
                      {maxPredictedHeatIndex ? "°F" : ""}
                      {maxPredictedHeatIndex ? (
                        <span className="ml-1 font-medium">
                          ({getHeatIndexCategory(maxPredictedHeatIndex).name})
                        </span>
                      ) : null}
                    </div>

                    <div className="text-right font-medium">Conditions:</div>
                    <div>{weatherData?.conditions}</div>

                    <div className="text-right font-medium">Location:</div>
                    <div className="break-words">{weatherData?.location}</div>
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
                      disabled={isSubmitting || !organization?.id}
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
                      disabled={isSubmitting || !organization?.id}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold">Required Precautions</h3>
                  <div className="rounded-md p-3 md:p-4" style={{ 
                    backgroundColor: `${getHeatIndexCategory(getHighestHeatIndex()).color}20`, 
                    borderColor: getContrastColor(getHeatIndexCategory(getHighestHeatIndex()).color),
                    borderWidth: 1
                  }}>
                    <h4 className="mb-2 text-sm md:text-base font-medium" style={{
                      color: getContrastColor(getHeatIndexCategory(getHighestHeatIndex()).color)
                    }}>
                      The following precautions are required for the highest heat index ({getHighestHeatIndex()}°F):
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                      {getHeatIndexCategory(getHighestHeatIndex()).precautions.map((precaution, index) => (
                        <li key={index}>{precaution}</li>
                      ))}
                    </ul>
                  </div>

                  <h3 className="text-base md:text-lg font-semibold">Precautions Being Taken</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Select all precautions that are being implemented at your work site:
                  </p>

                  <div className="grid gap-3 sm:grid-cols-1">
                    {getHeatIndexCategory(getHighestHeatIndex()).precautions.map((precaution, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Checkbox
                          id={`precaution-${index}`}
                          checked={selectedPrecautions.includes(precaution)}
                          onCheckedChange={(checked) => handlePrecautionChange(precaution, checked as boolean)}
                          disabled={isSubmitting || !organization?.id}
                        />
                        <Label htmlFor={`precaution-${index}`} className="text-sm font-normal leading-tight">
                          {precaution}
                        </Label>
                      </div>
                    ))}

                    <div className="mt-4">
                      <Label htmlFor="additionalNotes">Additional Notes / Other Precautions</Label>
                      <Textarea
                        id="additionalNotes"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="Enter any other precautions being taken or additional notes..."
                        rows={4}
                        className="mt-1"
                        disabled={isSubmitting || !organization?.id}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !organization?.id}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Compliance Record
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

