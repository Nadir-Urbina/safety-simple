"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Thermometer, Search, Droplets, Sun, AlertTriangle, Wind, Loader2, MapPin } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useWeather } from "../../../../contexts/weather-context"
import { useOrganization } from "@/contexts/organization-context"
import { HeatThreshold } from "@/src/types"
import { useRouter } from "next/navigation"

export default function CheckWeatherPage() {
  const { toast } = useToast()
  const { organization } = useOrganization()
  const [location, setLocation] = useState<string>("")
  const [thresholds, setThresholds] = useState<HeatThreshold[]>([])
  const [thresholdsLoading, setThresholdsLoading] = useState<boolean>(true)
  
  // Weather hook from context
  const { 
    weatherData, 
    forecast, 
    loading, 
    error, 
    getWeatherForLocation, 
    getCurrentLocationWeather 
  } = useWeather()

  const router = useRouter()

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

  const handleGetCurrentLocation = () => {
    getCurrentLocationWeather();
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    getWeatherForLocation(location);
  };

  const getHeatIndexCategory = (heatIndex: number): HeatThreshold => {
    // Sort thresholds by minHeatIndex to ensure proper order
    const sortedThresholds = [...thresholds].sort((a, b) => a.minHeatIndex - b.minHeatIndex);
    
    // Make sure we have thresholds, otherwise return a default
    if (sortedThresholds.length === 0) {
      return {
        id: "default",
        name: "Default Risk",
        minHeatIndex: 0,
        color: "green",
        precautions: ["Normal safety precautions"]
      };
    }
    
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

  // Add a function to get max heat index for today
  const getMaxHeatIndexForToday = (): number => {
    if (!forecast || forecast.length === 0) {
      return weatherData?.heatIndex || 0;
    }
    
    // Get today's date string
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's forecast
    const todayForecast = forecast.find(day => 
      new Date(day.date).toISOString().split('T')[0] === today
    );
    
    return todayForecast ? todayForecast.maxHeatIndex : (weatherData?.heatIndex || 0);
  };

  // Get the highest heat index (current or predicted max) for safety evaluation
  const getHighestHeatIndex = (): number => {
    const currentHeatIndex = weatherData?.heatIndex || 0;
    const maxPredictedHeatIndex = getMaxHeatIndexForToday();
    return Math.max(currentHeatIndex, maxPredictedHeatIndex);
  };

  return (
    <MainLayout>
      <div className="pb-16">
        {/* Header */}
        <div className="bg-blue-800 text-white py-4">
          <div className="flex items-center justify-center">
            <Thermometer className="mr-2 h-5 w-5" />
            <h1 className="text-xl font-bold">Heat Index Check</h1>
          </div>
        </div>
        
        <div className="px-4 py-4 space-y-4">
          {!organization?.id && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not Connected</AlertTitle>
              <AlertDescription>
                You must be logged in and connected to an organization to use this feature.
              </AlertDescription>
            </Alert>
          )}

          {error && error.includes("API key") && error.includes("Settings") && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                Please add an OpenWeatherMap API key in Settings &gt; Heat Prevention to use this feature.
              </AlertDescription>
            </Alert>
          )}

          {/* Get Current Location Button */}
          <Button
            onClick={handleGetCurrentLocation}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-sm"
            disabled={loading || !organization?.id}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
            Get Weather for Current Location
          </Button>

          {/* Manual Location Entry */}
          <div>
            <p className="text-center font-medium mb-2">Or, Enter the Location Manually:</p>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter city, city+state (Miami, FL), or ZIP code (32003)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 text-sm h-10"
                disabled={loading || !organization?.id}
              />
              <Button type="submit" size="icon" className="h-10 w-10" disabled={loading || !organization?.id}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          {error && !error.includes("API key") && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Weather Data Display */}
          {weatherData && (
            <div className="space-y-4">
              {/* Current Weather */}
              <div className="bg-blue-50 rounded-md p-3">
                <h2 className="text-center text-blue-800 font-semibold mb-3">
                  Current Weather Conditions
                </h2>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-right pr-3 font-medium">Temperature:</div>
                  <div>{weatherData.temperature}°F</div>
                  
                  <div className="text-right pr-3 font-medium">Humidity:</div>
                  <div>{weatherData.humidity}%</div>
                  
                  <div className="text-right pr-3 font-medium">Current Heat Index:</div>
                  <div className="font-medium" style={{ 
                    color: getContrastColor(getHeatIndexCategory(weatherData.heatIndex).color) 
                  }}>
                    {weatherData.heatIndex}°F
                    <span className="block">
                      ({getHeatIndexCategory(weatherData.heatIndex).name})
                    </span>
                  </div>
                  
                  <div className="text-right pr-3 font-medium">Predicted Max:</div>
                  <div className="font-medium" style={{ 
                    color: getContrastColor(getHeatIndexCategory(getMaxHeatIndexForToday()).color) 
                  }}>
                    {getMaxHeatIndexForToday()}°F
                    <span className="block">
                      ({getHeatIndexCategory(getMaxHeatIndexForToday()).name})
                    </span>
                  </div>
                  
                  <div className="text-right pr-3 font-medium">Conditions:</div>
                  <div>{weatherData.conditions}</div>
                  
                  <div className="text-right pr-3 font-medium">Location:</div>
                  <div className="break-words">{weatherData.location}</div>
                </div>
              </div>

              {/* Precautions Section */}
              {thresholdsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="rounded-md border p-3" style={{ 
                    borderColor: getContrastColor(getHeatIndexCategory(getHighestHeatIndex()).color),
                    backgroundColor: `${getHeatIndexCategory(getHighestHeatIndex()).color}10`,
                  }}>
                    <h3 className="font-semibold text-base mb-1" style={{ 
                      color: getContrastColor(getHeatIndexCategory(getHighestHeatIndex()).color) 
                    }}>
                      {getHeatIndexCategory(getHighestHeatIndex()).name}
                      <span className="block text-sm font-normal mt-1">
                        (Based on highest heat index: {getHighestHeatIndex()}°F)
                      </span>
                    </h3>
                    
                    <ul className="list-disc pl-5 space-y-1.5 text-sm">
                      {getHeatIndexCategory(getHighestHeatIndex()).precautions.map((precaution, index) => (
                        <li key={index} style={{ wordBreak: "break-word" }}>
                          {precaution}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className="w-full py-2.5 text-sm bg-green-600 hover:bg-green-700"
                    onClick={() => router.push("/heat/submit-jsa")}
                  >
                    Fill out Compliance Checklist
                  </Button>
                </>
              )}

              {/* Forecast Section */}
              {forecast && forecast.length > 0 && (
                <div className="pt-2">
                  <h3 className="font-semibold text-base mb-2">5-Day Forecast</h3>
                  
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-2 min-w-full">
                      {forecast.map((day, index) => (
                        <div key={index} className="flex-1 min-w-0 border rounded-md p-2 text-center">
                          <div className="font-medium text-xs">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-lg font-semibold" style={{ 
                            color: getContrastColor(getHeatIndexCategory(day.maxHeatIndex).color) 
                          }}>
                            {day.maxHeatIndex}°F
                          </div>
                          <div className="text-xs text-muted-foreground">
                            H: {day.maxTemperature}° L: {day.minTemperature}°
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

