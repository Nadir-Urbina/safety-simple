"use client"

import { useState } from "react"
import type { WeatherData } from "@/types"

interface UseWeatherProps {
  defaultLocation?: string
}

export function useWeather({ defaultLocation }: UseWeatherProps = {}) {
  const [location, setLocation] = useState<string>(defaultLocation || "")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherByLocation = async (locationString: string) => {
    if (!locationString.trim()) return

    setLoading(true)
    setError(null)

    try {
      // In a real app, this would call a weather API
      // Simulating API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock data
      setWeatherData({
        temperature: Math.floor(Math.random() * 15) + 75, // 75-90°F
        heatIndex: Math.floor(Math.random() * 20) + 80, // 80-100
        uvIndex: Math.floor(Math.random() * 10) + 1, // 1-10
        conditions: ["Sunny", "Partly Cloudy", "Cloudy", "Rainy"][Math.floor(Math.random() * 4)],
        location: locationString,
        timestamp: new Date(),
      })
    } catch (err) {
      setError("Failed to fetch weather data. Please try again.")
      console.error("Error fetching weather:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeatherByGeolocation = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, this would use the browser's geolocation API
      // and then call a weather API with the coordinates

      // Simulating geolocation and API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock data
      setWeatherData({
        temperature: Math.floor(Math.random() * 15) + 75, // 75-90°F
        heatIndex: Math.floor(Math.random() * 20) + 80, // 80-100
        uvIndex: Math.floor(Math.random() * 10) + 1, // 1-10
        conditions: ["Sunny", "Partly Cloudy", "Cloudy", "Rainy"][Math.floor(Math.random() * 4)],
        location: "Current Location",
        timestamp: new Date(),
      })
    } catch (err) {
      setError("Failed to get your location. Please enter it manually.")
      console.error("Error getting geolocation:", err)
    } finally {
      setLoading(false)
    }
  }

  const getHeatIndexCategory = (heatIndex: number) => {
    if (heatIndex < 80)
      return {
        category: "Low Risk",
        color: "text-green-500",
        precautions: "Normal Precautions, no need to submit JSA form",
        required: false,
      }
    if (heatIndex < 91)
      return {
        category: "Moderate Risk",
        color: "text-amber-500",
        precautions: "Take precautions and submit JSA form",
        required: true,
      }
    if (heatIndex < 103)
      return {
        category: "High Risk",
        color: "text-orange-500",
        precautions: "Take additional precautions and submit JSA form",
        required: true,
      }
    if (heatIndex < 115)
      return {
        category: "Very High Risk",
        color: "text-red-500",
        precautions: "Take extreme precautions and submit JSA form",
        required: true,
      }
    return {
      category: "Extreme Risk",
      color: "text-purple-600",
      precautions: "Consider rescheduling activities and submit JSA form",
      required: true,
    }
  }

  return {
    location,
    setLocation,
    weatherData,
    loading,
    error,
    fetchWeatherByLocation,
    fetchWeatherByGeolocation,
    getHeatIndexCategory,
  }
}

