"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useOrganization } from "@/contexts/organization-context"
import { 
  WeatherData, 
  getWeatherApiKey, 
  getWeatherByLocation, 
  getWeatherByCoordinates,
  getWeatherForecast
} from "../services/weather/weather-service"

export interface Forecast {
  date: Date
  maxTemperature: number
  minTemperature: number
  maxHeatIndex: number
  humidity: number
  conditions: string
}

interface WeatherContextType {
  weatherData: WeatherData | null
  forecast: Forecast[] | null
  loading: boolean
  error: string | null
  getWeatherForLocation: (location: string) => Promise<void>
  getCurrentLocationWeather: () => Promise<void>
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined)

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<Forecast[] | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Load API key when component mounts
  useEffect(() => {
    const loadApiKey = async () => {
      if (!organization?.id) return
      
      try {
        const key = await getWeatherApiKey(organization.id)
        setApiKey(key)
      } catch (err) {
        console.error("Error loading weather API key:", err)
        setError("Could not load weather API key")
      }
    }

    loadApiKey()
  }, [organization?.id])

  // Load weather data from sessionStorage on mount
  useEffect(() => {
    const savedWeatherData = sessionStorage.getItem('weatherData')
    const savedForecast = sessionStorage.getItem('forecast')
    
    if (savedWeatherData) {
      try {
        setWeatherData(JSON.parse(savedWeatherData))
      } catch (err) {
        console.error("Error parsing saved weather data:", err)
      }
    }
    
    if (savedForecast) {
      try {
        const parsedForecast = JSON.parse(savedForecast)
        // Convert date strings back to Date objects
        const forecastWithDates = parsedForecast.map((day: any) => ({
          ...day,
          date: new Date(day.date)
        }))
        setForecast(forecastWithDates)
      } catch (err) {
        console.error("Error parsing saved forecast data:", err)
      }
    }
  }, [])

  // Save weather data to sessionStorage when it changes
  useEffect(() => {
    if (weatherData) {
      sessionStorage.setItem('weatherData', JSON.stringify(weatherData))
    }
    
    if (forecast) {
      sessionStorage.setItem('forecast', JSON.stringify(forecast))
    }
  }, [weatherData, forecast])

  // Function to get weather data for a specific location
  const getWeatherForLocation = async (location: string) => {
    setLoading(true)
    setError(null)

    try {
      if (!apiKey) {
        throw new Error("No weather API key configured. Please add one in Settings > Heat Prevention.")
      }

      const data = await getWeatherByLocation(location, apiKey)
      
      if (!data) {
        throw new Error("Could not get weather data for this location")
      }
      
      setWeatherData(data)
      
      // If we have coordinates, also get the forecast
      if (data.coordinates) {
        const forecastData = await getWeatherForecast(
          data.coordinates.lat, 
          data.coordinates.lon, 
          apiKey
        )
        
        setForecast(forecastData)
      }
    } catch (err) {
      console.error("Error getting weather:", err)
      setError(err instanceof Error ? err.message : "Failed to get weather data")
    } finally {
      setLoading(false)
    }
  }

  // Function to get weather for current location using browser geolocation
  const getCurrentLocationWeather = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!apiKey) {
        throw new Error("No weather API key configured. Please add one in Settings > Heat Prevention.")
      }

      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser")
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords
      
      const data = await getWeatherByCoordinates(latitude, longitude, apiKey)
      
      if (!data) {
        throw new Error("Could not get weather data for your location")
      }
      
      setWeatherData(data)
      
      // Also get the forecast
      const forecastData = await getWeatherForecast(latitude, longitude, apiKey)
      setForecast(forecastData)
    } catch (err) {
      console.error("Error getting current location weather:", err)
      setError(err instanceof Error ? err.message : "Failed to get weather data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <WeatherContext.Provider 
      value={{ 
        weatherData, 
        forecast, 
        loading, 
        error, 
        getWeatherForLocation, 
        getCurrentLocationWeather 
      }}
    >
      {children}
    </WeatherContext.Provider>
  )
}

export function useWeather() {
  const context = useContext(WeatherContext)
  
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider')
  }
  
  return context
} 