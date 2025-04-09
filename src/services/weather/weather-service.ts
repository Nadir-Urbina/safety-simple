import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WeatherData, WeatherReading, DailyWeatherSummary } from '@/types/weather';

// Helper function to retry API calls
async function fetchWithRetry(url: string, maxRetries = 2) {
  let retries = 0;
  let lastError;

  while (retries <= maxRetries) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`API call failed with status: ${response.status} (${response.statusText})`);
        
        // For 401 errors (unauthorized), don't retry as it's likely an API key issue
        if (response.status === 401) {
          throw new Error(`API key error (401 Unauthorized): The API key may be invalid or missing quotes`);
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${retries + 1}/${maxRetries + 1} failed:`, error);
      
      // Don't retry for API key errors
      if (error instanceof Error && error.message.includes('401')) {
        throw error;
      }
      
      retries++;
      if (retries <= maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retries * 500));
        console.log(`Retrying API call (attempt ${retries + 1}/${maxRetries + 1})...`);
      }
    }
  }
  
  throw lastError;
}

/**
 * Get the configured OpenWeatherMap API key for the organization
 * This will try to read from environment variables first, then fall back to Firestore settings
 */
export async function getWeatherApiKey(organizationId: string): Promise<string | null> {
  // First check for environment variable
  if (process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY) {
    // Remove any quotes that might be in the env variable
    return process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY.replace(/"/g, '');
  }
  
  // Fall back to checking Firestore if environment variable is not set
  try {
    const settingsDoc = await getDoc(doc(db, "organizations", organizationId, "settings", "heatPrevention"));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      const apiKey = data.weatherApiKey || null;
      return apiKey ? apiKey.replace(/"/g, '') : null;
    }
    return null;
  } catch (error) {
    console.error("Error getting weather API key:", error);
    return null;
  }
}

/**
 * Calculate heat index based on temperature (F) and relative humidity (%)
 * Using the heat index equation from the National Weather Service
 * https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
 */
export function calculateHeatIndex(temperature: number, humidity: number): number {
  // If temp is less than 80F, heat index is just the temperature
  if (temperature < 80) {
    return Math.round(temperature);
  }

  // Simplified heat index formula
  let heatIndex = 0.5 * (temperature + 61.0 + ((temperature - 68.0) * 1.2) + (humidity * 0.094));

  // More precise calculation if temperature is high enough
  if (heatIndex > 80) {
    const t = temperature;
    const rh = humidity;
    
    // Coefficients for the heat index equation
    const c1 = -42.379;
    const c2 = 2.04901523;
    const c3 = 10.14333127;
    const c4 = -0.22475541;
    const c5 = -0.00683783;
    const c6 = -0.05481717;
    const c7 = 0.00122874;
    const c8 = 0.00085282;
    const c9 = -0.00000199;
    
    // Calculate the heat index
    heatIndex = c1 + (c2 * t) + (c3 * rh) + (c4 * t * rh) + (c5 * t * t) + 
                (c6 * rh * rh) + (c7 * t * t * rh) + (c8 * t * rh * rh) + 
                (c9 * t * t * rh * rh);
    
    // Apply adjustments for extreme conditions
    if (rh < 13 && t >= 80 && t <= 112) {
      heatIndex -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
    } else if (rh > 85 && t >= 80 && t <= 87) {
      heatIndex += ((rh - 85) / 10) * ((87 - t) / 5);
    }
  }
  
  return Math.round(heatIndex);
}

/**
 * Get weather data from OpenWeatherMap for the given location
 */
export async function getWeatherByLocation(
  location: string, 
  apiKey: string
): Promise<WeatherData | null> {
  try {
    if (!location || !location.trim()) {
      throw new Error("Empty location provided");
    }
    
    console.log("Using API key for location search (length):", apiKey ? apiKey.length : 0);
    
    // Format query - if input looks like a US zip code, add country code
    let query = location.trim();
    const isZipCode = /^\d{5}(-\d{4})?$/.test(query);
    
    if (isZipCode) {
      // Extract just the 5-digit code if it's a ZIP+4
      const zipOnly = query.substring(0, 5);
      query = `${zipOnly},us`;
      console.log("ZIP code detected, formatted as:", query);
    } else {
      console.log("Not a ZIP code, using as is:", query);
    }
    
    // First get coordinates from location string
    const encodedQuery = encodeURIComponent(query);
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodedQuery}&limit=1&appid=${apiKey}`;
    console.log("Fetching geo data from:", geoUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const geoResponse = await fetchWithRetry(geoUrl);
    const geoData = await geoResponse.json();
    
    console.log("Geo API response:", JSON.stringify(geoData));
    
    if (!geoData || !Array.isArray(geoData) || geoData.length === 0) {
      // If it was a ZIP code and failed, try another API endpoint specifically for ZIP codes
      if (isZipCode) {
        console.log("ZIP lookup failed with direct API, trying ZIP-specific endpoint");
        const zipOnly = query.split(',')[0];
        const zipUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipOnly},us&appid=${apiKey}`;
        console.log("Fetching from ZIP API:", zipUrl.replace(apiKey, 'API_KEY_HIDDEN'));
        
        const zipResponse = await fetchWithRetry(zipUrl);
        const zipData = await zipResponse.json();
        
        console.log("ZIP API response:", JSON.stringify(zipData));
        
        if (zipData && zipData.lat && zipData.lon) {
          // Get current weather data using coordinates from ZIP API
          return await getWeatherByCoordinates(zipData.lat, zipData.lon, apiKey);
        }
      }
      
      throw new Error("Location not found");
    }
    
    const { lat, lon, name } = geoData[0];
    
    // Get current weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
    console.log("Fetching weather data from:", weatherUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    const weatherResponse = await fetchWithRetry(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    if (!weatherData) {
      throw new Error("Weather data not found");
    }
    
    // Skip UV index from OneCall API as it requires paid subscription
    // Just use the basic weather data we already have
    const temperature = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const heatIndex = calculateHeatIndex(temperature, humidity);
    const conditions = weatherData.weather[0].main;
    
    return {
      temperature,
      humidity,
      heatIndex,
      uvIndex: 0, // Default to 0 as we can't get this without One Call API
      conditions,
      location: name,
      timestamp: new Date(),
      coordinates: { lat, lon }
    };
  } catch (error) {
    console.error("Error getting weather data:", error);
    return null;
  }
}

/**
 * Get weather data using geolocation coordinates
 */
export async function getWeatherByCoordinates(
  latitude: number, 
  longitude: number, 
  apiKey: string
): Promise<WeatherData | null> {
  try {
    console.log("Using API key for weather (length):", apiKey ? apiKey.length : 0);
    
    // Get location name from coordinates
    const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
    console.log("Fetching location data from:", geoUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    const geoResponse = await fetchWithRetry(geoUrl);
    const geoData = await geoResponse.json();
    
    let locationName = "Current Location";
    if (geoData && geoData[0] && geoData[0].name) {
      locationName = `${geoData[0].name}, ${geoData[0].state || ''} ${geoData[0].country || ''}`.trim();
    }
    
    // Get current weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${apiKey}`;
    console.log("Fetching weather data from:", weatherUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    const weatherResponse = await fetchWithRetry(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    if (!weatherData) {
      throw new Error("Weather data not found");
    }
    
    // Skip OneCall API for UV index as it requires paid subscription
    
    const temperature = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const heatIndex = calculateHeatIndex(temperature, humidity);
    const conditions = weatherData.weather[0].main;
    
    return {
      temperature,
      humidity,
      heatIndex,
      uvIndex: 0, // Default to 0 as we can't get this without One Call API
      conditions,
      location: locationName,
      timestamp: new Date(),
      coordinates: { lat: latitude, lon: longitude }
    };
  } catch (error) {
    console.error("Error getting weather data:", error);
    return null;
  }
}

/**
 * Get the forecast for the next few days
 * This is useful for planning work and checking future heat index
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  apiKey: string,
  days: number = 5
): Promise<Array<{
  date: Date;
  maxTemperature: number;
  minTemperature: number;
  maxHeatIndex: number;
  humidity: number;
  conditions: string;
}> | null> {
  try {
    // Using the free 5-day forecast endpoint instead of OneCall
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=imperial&appid=${apiKey}`;
    console.log("Fetching forecast data from:", forecastUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    const forecastResponse = await fetchWithRetry(forecastUrl);
    const forecastData = await forecastResponse.json();
    
    if (!forecastData || !forecastData.list) {
      throw new Error("Forecast data not found");
    }
    
    // Process forecast data by day
    const dailyForecasts = new Map();
    
    for (const reading of forecastData.list) {
      const date = new Date(reading.dt * 1000);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyForecasts.has(dateString)) {
        dailyForecasts.set(dateString, {
          date,
          maxTemperature: -Infinity,
          minTemperature: Infinity,
          maxHeatIndex: -Infinity,
          readings: []
        });
      }
      
      const dayForecast = dailyForecasts.get(dateString);
      
      // Track min/max temperature
      if (reading.main.temp > dayForecast.maxTemperature) {
        dayForecast.maxTemperature = reading.main.temp;
      }
      if (reading.main.temp < dayForecast.minTemperature) {
        dayForecast.minTemperature = reading.main.temp;
      }
      
      // Calculate and track heat index
      const heatIndex = calculateHeatIndex(reading.main.temp, reading.main.humidity);
      if (heatIndex > dayForecast.maxHeatIndex) {
        dayForecast.maxHeatIndex = heatIndex;
      }
      
      // Add reading to calculate averages later
      dayForecast.readings.push({
        temperature: reading.main.temp,
        humidity: reading.main.humidity,
        conditions: reading.weather[0].main
      });
    }
    
    // Convert map to array, sorted by date
    const result = Array.from(dailyForecasts.values())
      .map(day => {
        // Calculate average humidity and most common condition
        const avgHumidity = day.readings.reduce((sum: number, r: WeatherReading) => sum + r.humidity, 0) / day.readings.length;
        
        // Get most common condition
        const conditionCounts = day.readings.reduce((counts: Record<string, number>, r: WeatherReading) => {
          counts[r.conditions] = (counts[r.conditions] || 0) + 1;
          return counts;
        }, {} as Record<string, number>);
        const dominantCondition = Object.entries(conditionCounts)
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
        
        return {
          date: day.date,
          maxTemperature: Math.round(day.maxTemperature),
          minTemperature: Math.round(day.minTemperature),
          maxHeatIndex: Math.round(day.maxHeatIndex),
          humidity: Math.round(avgHumidity),
          conditions: dominantCondition
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, days);
    
    return result;
  } catch (error) {
    console.error("Error getting forecast data:", error);
    return null;
  }
} 