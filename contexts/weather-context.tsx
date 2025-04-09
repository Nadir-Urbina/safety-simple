"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useOrganization } from "./organization-context"
import { WeatherData } from "@/types/weather"
import { 
  getWeatherApiKey, 
  getWeatherByLocation, 
  getWeatherByCoordinates,
  getWeatherForecast
} from "../src/services/weather/weather-service"

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
  const defaultApiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY
    ? process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY.replace(/"/g, '')
    : null
  
  const [apiKey, setApiKey] = useState<string | null>(defaultApiKey)
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
        if (key) {
          setApiKey(key)
        } else if (process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY) {
          // Fallback to env key if no org key (with quotes removed)
          setApiKey(process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY.replace(/"/g, ''))
        }
      } catch (err) {
        console.error("Error loading weather API key:", err)
        // Still fallback to env key if available
        if (process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY) {
          setApiKey(process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY.replace(/"/g, ''))
        } else {
          setError("Could not load weather API key")
        }
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
        const usingEnvVar = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY ? true : false;
        if (usingEnvVar) {
          throw new Error("Weather API configuration error. Please check your environment variables.");
        } else {
          throw new Error("No weather API key configured. Please add one in Settings > Heat Prevention.");
        }
      }
      
      if (!location || !location.trim()) {
        throw new Error("Please enter a location to search");
      }
      
      console.log("Getting weather for location:", location);
      const data = await getWeatherByLocation(location, apiKey)
      
      if (!data) {
        throw new Error("Could not retrieve weather data. Please try a different location format or check your API key.")
      }
      
      setWeatherData(data)
      
      // If we have coordinates, also get the forecast
      if (data.coordinates) {
        console.log("Getting forecast for coordinates:", data.coordinates);
        const forecastData = await getWeatherForecast(
          data.coordinates.lat, 
          data.coordinates.lon, 
          apiKey
        )
        
        setForecast(forecastData)
      }
    } catch (err) {
      console.error("Error getting weather:", err)
      
      // Handle specific errors with user-friendly messages
      if (err instanceof Error) {
        if (err.message.includes("401")) {
          setError("Invalid API key. Please check your OpenWeatherMap API key configuration.")
        } else if (err.message.includes("Location not found")) {
          setError("Location not found. Try entering a city name (e.g., 'Jacksonville'), a city and state (e.g., 'Miami, FL'), or a ZIP code (e.g., '32003').")
        } else if (err.message.includes("Empty location")) {
          setError("Please enter a location to search")
        } else {
          setError(err.message)
        }
      } else {
        setError("Failed to get weather data")
      }
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
        const usingEnvVar = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY ? true : false;
        if (usingEnvVar) {
          throw new Error("Weather API configuration error. Please check your environment variables.");
        } else {
          throw new Error("No weather API key configured. Please add one in Settings > Heat Prevention.");
        }
      }
      
      console.log("API key being used:", apiKey ? `...${apiKey.slice(-5)}` : "none");

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
      console.log("Got coordinates:", latitude, longitude);
      
      const data = await getWeatherByCoordinates(latitude, longitude, apiKey)
      
      if (!data) {
        throw new Error("Could not get weather data for your location")
      }
      
      setWeatherData(data)
      
      // Also get the forecast
      console.log("Getting forecast");
      const forecastData = await getWeatherForecast(latitude, longitude, apiKey)
      setForecast(forecastData)
    } catch (err) {
      console.error("Error getting current location weather:", err)
      
      // Handle specific API key errors
      if (err instanceof Error && err.message.includes("401")) {
        setError("Invalid API key. Please check your OpenWeatherMap API key configuration.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to get weather data")
      }
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