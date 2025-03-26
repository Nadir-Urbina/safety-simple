"use client"

import type React from "react"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { WeatherData } from "@/types"
import { Loader2, Search, Thermometer, Droplets, Sun, AlertTriangle } from "lucide-react"

export default function CheckWeatherPage() {
  const [location, setLocation] = useState<string>("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetCurrentLocation = () => {
    setLoading(true)
    setError(null)

    // In a real app, this would use the browser's geolocation API
    // and then call a weather API with the coordinates

    // Simulating API call with timeout
    setTimeout(() => {
      setWeatherData({
        temperature: 78,
        heatIndex: 85,
        uvIndex: 7,
        conditions: "Sunny",
        location: "Current Location",
        timestamp: new Date(),
      })
      setLoading(false)
    }, 1500)
  }

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) return

    setLoading(true)
    setError(null)

    // In a real app, this would call a weather API with the location string

    // Simulating API call with timeout
    setTimeout(() => {
      setWeatherData({
        temperature: 82,
        heatIndex: 88,
        uvIndex: 8,
        conditions: "Partly Cloudy",
        location: location,
        timestamp: new Date(),
      })
      setLoading(false)
    }, 1500)
  }

  const getHeatIndexCategory = (heatIndex: number) => {
    if (heatIndex < 80)
      return {
        category: "Low Risk",
        color: "text-green-500",
        precautions: "Normal Precautions, no need to submit JSA form",
      }
    if (heatIndex < 91)
      return { category: "Moderate Risk", color: "text-amber-500", precautions: "Take precautions and submit JSA form" }
    if (heatIndex < 103)
      return {
        category: "High Risk",
        color: "text-orange-500",
        precautions: "Take additional precautions and submit JSA form",
      }
    if (heatIndex < 115)
      return {
        category: "Very High Risk",
        color: "text-red-500",
        precautions: "Take extreme precautions and submit JSA form",
      }
    return {
      category: "Extreme Risk",
      color: "text-purple-600",
      precautions: "Consider rescheduling activities and submit JSA form",
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl p-4 pb-20 md:p-8 md:pb-8">
        <Card>
          <CardHeader className="bg-blue-800 text-white">
            <CardTitle className="flex items-center justify-center text-2xl">
              <Thermometer className="mr-2 h-6 w-6" />
              Heat Index
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Button
                onClick={handleGetCurrentLocation}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Get Weather for Current Location
              </Button>

              <div className="text-center">
                <p className="text-lg font-medium">Or, Enter the Location Manually:</p>
              </div>

              <form onSubmit={handleManualSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter address, city, or zip code"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>

              {error && <div className="rounded-md bg-destructive/15 p-3 text-center text-destructive">{error}</div>}

              {weatherData && (
                <div className="space-y-4">
                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-red-500" />
                      <span className="text-lg font-medium">Temperature:</span>
                    </div>
                    <span className="text-lg font-bold">{weatherData.temperature}°F</span>

                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <span className="text-lg font-medium">Heat Index:</span>
                    </div>
                    <span className={`text-lg font-bold ${getHeatIndexCategory(weatherData.heatIndex).color}`}>
                      {weatherData.heatIndex}
                    </span>

                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-purple-500" />
                      <span className="text-lg font-medium">UV Index:</span>
                    </div>
                    <span className="text-lg font-bold">{weatherData.uvIndex}</span>

                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <span className="text-lg font-medium">Conditions:</span>
                    </div>
                    <span className="text-lg font-bold">{weatherData.conditions}</span>
                  </div>

                  <div className="rounded-md bg-muted p-4 text-center">
                    <p className="text-lg font-medium">{getHeatIndexCategory(weatherData.heatIndex).precautions}</p>
                  </div>

                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <a href="/heat/submit-jsa">Fill out JSA</a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

