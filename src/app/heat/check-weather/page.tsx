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
import { ResponsiveContainer } from "@/components/layout/responsive-container"

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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6">
        <ResponsiveContainer className="text-center">
          <Thermometer className="h-8 w-8 mb-4 inline-block" />
          <h1 className="text-2xl md:text-3xl font-bold">Heat Index Check</h1>
          <p className="mt-2 text-blue-100 max-w-lg mx-auto">
            Check weather conditions and heat index to take appropriate precautions
          </p>
        </ResponsiveContainer>
      </div>
      
      <ResponsiveContainer className="space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Get Current Location Button */}
            <Button
              onClick={handleGetCurrentLocation}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700"
              disabled={loading || !organization?.id}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Get Weather for Current Location
            </Button>

            {/* Manual Location Entry */}
            <div>
              <p className="text-center text-sm text-muted-foreground mb-2">Or, Enter the Location Manually:</p>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="City, State or ZIP code"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1"
                  disabled={loading || !organization?.id}
                />
                <Button type="submit" className="flex-shrink-0" disabled={loading || !organization?.id}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {error && !error.includes("API key") && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Weather Data Display */}
        {weatherData && (
          <div className="space-y-6">
            {/* Current Weather */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Current Weather in {weatherData.location}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {new Date(weatherData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                    <Thermometer className="h-6 w-6 text-red-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Temperature</span>
                    <span className="text-xl font-semibold">{Math.round(weatherData.temperature)}°F</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                    <Thermometer className="h-6 w-6 text-orange-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Heat Index</span>
                    <span className="text-xl font-semibold">{Math.round(weatherData.heatIndex)}°F</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                    <Droplets className="h-6 w-6 text-blue-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Humidity</span>
                    <span className="text-xl font-semibold">{Math.round(weatherData.humidity)}%</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                    <Wind className="h-6 w-6 text-sky-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Wind Speed</span>
                    <span className="text-xl font-semibold">{Math.round((weatherData as any).windSpeed || 0)} mph</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Risk Assessment */}
            {!thresholdsLoading && (
              <Card>
                <CardHeader>
                  <CardTitle>Heat Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const highestHeatIndex = getHighestHeatIndex();
                    const category = getHeatIndexCategory(highestHeatIndex);
                    const contrastColor = getContrastColor(category.color);
                    
                    return (
                      <>
                        <div className="flex items-center justify-between rounded-md border p-4 shadow-sm mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <p className="text-muted-foreground">Current heat index: {Math.round(weatherData.heatIndex)}°F</p>
                            {forecast && forecast.length > 0 && (
                              <p className="text-muted-foreground">
                                Max forecast heat index today: {Math.round(getMaxHeatIndexForToday())}°F
                              </p>
                            )}
                          </div>
                          <div 
                            className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: contrastColor }}
                          >
                            {Math.round(highestHeatIndex)}°F
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">Recommended Precautions:</h4>
                          <ul className="list-disc ml-5 space-y-1">
                            {category.precautions.map((precaution, index) => (
                              <li key={index} className="text-muted-foreground">{precaution}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <Button 
                          onClick={() => router.push('/heat/submit-jsa')}
                          className="w-full"
                        >
                          Complete Heat JSA Form
                        </Button>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
            
            {/* Forecast Display */}
            {forecast && forecast.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>5-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="flex space-x-2 min-w-max md:min-w-0">
                    {forecast.map((day, index) => {
                      const category = getHeatIndexCategory(day.maxHeatIndex);
                      const dateObj = new Date(day.date);
                      const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                      const monthDay = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      
                      return (
                        <div key={index} className="flex-1 min-w-24 border rounded-lg p-3 text-center">
                          <div className="font-medium">{dayName}</div>
                          <div className="text-xs text-muted-foreground mb-2">{monthDay}</div>
                          
                          <div className="flex flex-col items-center gap-1 mb-2">
                            <span className="text-xs text-muted-foreground">High / Low</span>
                            <div>
                              <span className="font-semibold">{Math.round((day as any).tempMax || day.maxTemperature)}° </span>
                              <span className="text-muted-foreground">/ {Math.round((day as any).tempMin || day.minTemperature)}°</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-muted-foreground">Heat Index</span>
                            <div
                              className="rounded-full px-2 py-1 text-xs font-semibold text-white"
                              style={{ backgroundColor: getContrastColor(category.color) }}
                            >
                              {Math.round(day.maxHeatIndex)}°F
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </ResponsiveContainer>
    </MainLayout>
  )
}

