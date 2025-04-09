// Weather data types
export interface WeatherData {
  temperature: number;
  heatIndex: number;
  uvIndex: number;
  humidity: number;
  conditions: string;
  location: string;
  timestamp: Date;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface WeatherReading {
  temperature: number;
  humidity: number;
  heatIndex: number;
  uvIndex: number;
  conditions: string;
  timestamp: Date;
}

export interface DailyWeatherSummary {
  date: string;
  avgTemperature: number;
  avgHeatIndex: number;
  avgHumidity: number;
  maxTemperature: number;
  maxHeatIndex: number;
  dominantCondition: string;
  readings: WeatherReading[];
}

export interface HeatIndexCategory {
  name: string;
  range: [number, number];
  color: string;
  recommendations: string[];
}

export interface HeatPreventionSettings {
  enableAlerts: boolean;
  alertThreshold: number;
  requireJSAAbove: number;
  customThresholds: HeatThreshold[];
}

export interface HeatThreshold {
  id: string;
  name: string;
  minHeatIndex: number;
  maxHeatIndex: number;
  color: string;
  requiredPrecautions: string[];
} 