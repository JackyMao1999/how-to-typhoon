import { RealWeatherData, WeatherFetchResult } from './types';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export async function fetchWeatherAt(
  lng: number,
  lat: number,
): Promise<WeatherFetchResult> {
  try {
    const roundedLat = lat.toFixed(1);
    const roundedLng = lng.toFixed(1);

    // 海洋气象 API（海面温度）
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${roundedLat}&longitude=${roundedLng}&current=sea_surface_temperature`;
    const marineRes = await fetch(marineUrl);
    if (!marineRes.ok) throw new Error(`Marine API returned ${marineRes.status}`);
    const marineJson = await marineRes.json();
    const sst = marineJson?.current?.sea_surface_temperature;
    if (sst === undefined) throw new Error('No SST data');

    // 高空天气 API（风切变、湿度、气压）— 使用 m/s 单位
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLng}&current=temperature_2m,relative_humidity_2m,surface_pressure&hourly=temperature_200hPa,wind_speed_200hPa,wind_speed_850hPa&wind_speed_unit=ms`;
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) throw new Error(`Forecast API returned ${forecastRes.status}`);
    const forecastJson = await forecastRes.json();
    const current = forecastJson?.current;

    if (!current) throw new Error('No forecast data');

    // 风切变：200hPa - 850hPa 风速差（取当前小时的值）
    const hourly = forecastJson?.hourly;
    let shear850 = 8;
    let shear200 = 10;
    if (hourly?.wind_speed_850hPa?.length > 0) {
      shear850 = hourly.wind_speed_850hPa[0] ?? 8;
    }
    if (hourly?.wind_speed_200hPa?.length > 0) {
      shear200 = hourly.wind_speed_200hPa[0] ?? 10;
    }
    const windShear = Math.round(Math.min(40, Math.abs(shear200 - shear850)) * 10) / 10;

    const humidity = Math.round(clamp(current.relative_humidity_2m ?? 65, 20, 100));
    const surfacePressure = Math.round(current.surface_pressure ?? 1013);
    const airTemp = current.temperature_2m ?? 28;
    const sstRounded = Math.round(sst * 10) / 10;

    // 海洋热含量从 SST 推算
    const oceanHeatContent = clamp((sst - 20) / 12, 0.05, 0.95);

    // 陆地温度：气温+2°C 近似
    const landTemperature = Math.round(clamp(airTemp + 2, 18, 40) * 10) / 10;

    return {
      success: true,
      data: {
        seaSurfaceTemp: sstRounded,
        verticalWindShear: windShear,
        midLevelHumidity: humidity,
        surfacePressure,
        oceanHeatContent: Math.round(oceanHeatContent * 100) / 100,
        landTemperature,
        fetchedAt: Date.now(),
        lat,
        lng,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    console.warn('Open-Meteo fetch failed:', msg);
    return { success: false, data: null, error: msg };
  }
}
