export interface RealWeatherData {
  seaSurfaceTemp: number;
  verticalWindShear: number;
  midLevelHumidity: number;
  surfacePressure: number;
  oceanHeatContent: number;
  landTemperature: number;
  fetchedAt: number;
  lat: number;
  lng: number;
}

export interface WeatherFetchResult {
  success: boolean;
  data: RealWeatherData | null;
  error?: string;
}
