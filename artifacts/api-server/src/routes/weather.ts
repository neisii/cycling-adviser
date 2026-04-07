import { Router, type IRouter } from "express";
import {
  GetWeatherCurrentQueryParams,
  GetWeatherForecastQueryParams,
  GetCitiesResponse,
  GetWeatherCurrentResponse,
  GetWeatherForecastResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// === City Registry ===

type CityId =
  | "seoul"
  | "busan"
  | "incheon"
  | "daegu"
  | "gwangju"
  | "daejeon"
  | "ulsan"
  | "jeju";

interface City {
  id: CityId;
  name_ko: string;
  name_en: string;
  lat: number;
  lon: number;
}

const CITIES: City[] = [
  { id: "seoul", name_ko: "서울", name_en: "Seoul", lat: 37.5665, lon: 126.978 },
  { id: "busan", name_ko: "부산", name_en: "Busan", lat: 35.1796, lon: 129.0756 },
  { id: "incheon", name_ko: "인천", name_en: "Incheon", lat: 37.4563, lon: 126.7052 },
  { id: "daegu", name_ko: "대구", name_en: "Daegu", lat: 35.8714, lon: 128.6014 },
  { id: "gwangju", name_ko: "광주", name_en: "Gwangju", lat: 35.1595, lon: 126.8526 },
  { id: "daejeon", name_ko: "대전", name_en: "Daejeon", lat: 36.3504, lon: 127.3845 },
  { id: "ulsan", name_ko: "울산", name_en: "Ulsan", lat: 35.5384, lon: 129.3114 },
  { id: "jeju", name_ko: "제주", name_en: "Jeju", lat: 33.4996, lon: 126.5312 },
];

const CITY_MAP = new Map<string, City>(
  CITIES.flatMap((c) => [
    [c.id, c],
    [c.name_ko, c],
    [c.name_en.toLowerCase(), c],
    [c.name_en, c],
  ])
);

function getCityByName(name: string): City | null {
  return CITY_MAP.get(name) ?? CITY_MAP.get(name.toLowerCase()) ?? null;
}

// === Weather Types ===

type WeatherCondition =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "overcast"
  | "drizzle"
  | "light_rain"
  | "moderate_rain"
  | "heavy_rain"
  | "thunderstorm"
  | "snow"
  | "blizzard"
  | "fog"
  | "haze"
  | "extreme";

interface NormalizedWeather {
  temp: number;
  feels_like: number;
  temp_max: number;
  temp_min: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  condition: WeatherCondition;
  precip_mm: number;
  precip_prob: number;
  uv_index: number | null;
  visibility: number | null;
}

type ProviderId = "openweather" | "weatherapi" | "openmeteo";

interface ProviderResult {
  provider: ProviderId;
  data: NormalizedWeather | null;
  error: string | null;
}

interface AggregatedWeather {
  weather: NormalizedWeather;
  confidence: { temp: number; wind: number; humidity: number; overall: number };
  providers_used: string[];
  providers_failed: string[];
  incomplete_data: boolean;
  cached_at: string | null;
  provider_data: ProviderResult[];
}

// === Weather Normalization ===

const OW_ICON_MAP: Record<string, WeatherCondition> = {
  "01d": "clear",
  "01n": "clear",
  "02d": "partly_cloudy",
  "02n": "partly_cloudy",
  "03d": "cloudy",
  "03n": "cloudy",
  "04d": "overcast",
  "04n": "overcast",
  "09d": "drizzle",
  "09n": "drizzle",
  "10d": "light_rain",
  "10n": "light_rain",
  "11d": "thunderstorm",
  "11n": "thunderstorm",
  "13d": "snow",
  "13n": "snow",
  "50d": "fog",
  "50n": "fog",
};

const WMO_MAP: Record<number, WeatherCondition> = {
  0: "clear",
  1: "partly_cloudy",
  2: "partly_cloudy",
  3: "overcast",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  61: "light_rain",
  63: "moderate_rain",
  65: "heavy_rain",
  71: "snow",
  73: "snow",
  75: "blizzard",
  77: "snow",
  80: "light_rain",
  81: "moderate_rain",
  82: "heavy_rain",
  85: "snow",
  86: "blizzard",
  95: "thunderstorm",
  96: "thunderstorm",
  99: "thunderstorm",
};

const WA_CODE_MAP: Record<number, WeatherCondition> = {
  1000: "clear",
  1003: "partly_cloudy",
  1006: "cloudy",
  1009: "overcast",
  1030: "haze",
  1063: "drizzle",
  1066: "snow",
  1069: "drizzle",
  1072: "drizzle",
  1087: "thunderstorm",
  1114: "snow",
  1117: "blizzard",
  1135: "fog",
  1147: "fog",
  1150: "drizzle",
  1153: "drizzle",
  1168: "drizzle",
  1171: "light_rain",
  1180: "light_rain",
  1183: "light_rain",
  1186: "moderate_rain",
  1189: "moderate_rain",
  1192: "heavy_rain",
  1195: "heavy_rain",
  1198: "light_rain",
  1201: "heavy_rain",
  1204: "drizzle",
  1207: "light_rain",
  1210: "snow",
  1213: "snow",
  1216: "snow",
  1219: "snow",
  1222: "snow",
  1225: "blizzard",
  1237: "snow",
  1240: "light_rain",
  1243: "heavy_rain",
  1246: "heavy_rain",
  1249: "drizzle",
  1252: "light_rain",
  1255: "snow",
  1258: "snow",
  1261: "drizzle",
  1264: "heavy_rain",
  1273: "thunderstorm",
  1276: "thunderstorm",
  1279: "thunderstorm",
  1282: "thunderstorm",
};

function normalizeOpenWeatherCurrent(raw: unknown): NormalizedWeather {
  const r = raw as {
    main: { temp: number; feels_like: number; temp_max: number; temp_min: number; humidity: number; pressure: number };
    wind: { speed: number; deg: number };
    weather: Array<{ icon: string; main: string }>;
    rain?: { "1h"?: number };
    visibility?: number;
    uvi?: number;
  };
  const icon = r.weather[0]?.icon ?? "";
  const condition: WeatherCondition = OW_ICON_MAP[icon] ?? "cloudy";
  return {
    temp: r.main.temp,
    feels_like: r.main.feels_like,
    temp_max: r.main.temp_max,
    temp_min: r.main.temp_min,
    humidity: r.main.humidity,
    pressure: r.main.pressure,
    wind_speed: r.wind.speed,
    wind_deg: r.wind.deg ?? 0,
    condition,
    precip_mm: r.rain?.["1h"] ?? 0,
    precip_prob: 0,
    uv_index: r.uvi ?? null,
    visibility: r.visibility ?? null,
  };
}

function normalizeOpenWeatherForecast(raw: unknown, dayIndex: number): NormalizedWeather {
  const r = raw as {
    list: Array<{
      dt: number;
      main: { temp: number; feels_like: number; temp_max: number; temp_min: number; humidity: number; pressure: number };
      wind: { speed: number; deg: number };
      weather: Array<{ icon: string }>;
      rain?: { "3h"?: number };
      visibility?: number;
      pop?: number;
    }>;
  };
  const dayStart = dayIndex * 8;
  const dayItems = r.list.slice(dayStart, dayStart + 8);
  if (dayItems.length === 0) {
    const item = r.list[0] ?? r.list[0];
    const icon = item?.weather[0]?.icon ?? "";
    return {
      temp: item?.main.temp ?? 20,
      feels_like: item?.main.feels_like ?? 18,
      temp_max: item?.main.temp_max ?? 22,
      temp_min: item?.main.temp_min ?? 18,
      humidity: item?.main.humidity ?? 60,
      pressure: item?.main.pressure ?? 1013,
      wind_speed: item?.wind.speed ?? 3,
      wind_deg: item?.wind.deg ?? 0,
      condition: OW_ICON_MAP[icon] ?? "cloudy",
      precip_mm: 0,
      precip_prob: 0,
      uv_index: null,
      visibility: null,
    };
  }
  const temps = dayItems.map((i) => i.main.temp);
  const mainItem = dayItems[Math.floor(dayItems.length / 2)] ?? dayItems[0];
  const icon = mainItem?.weather[0]?.icon ?? "";
  const maxPop = Math.max(...dayItems.map((i) => (i.pop ?? 0) * 100));
  const totalRain = dayItems.reduce((sum, i) => sum + (i.rain?.["3h"] ?? 0), 0);
  return {
    temp: temps.reduce((a, b) => a + b, 0) / temps.length,
    feels_like: mainItem?.main.feels_like ?? temps[0] ?? 20,
    temp_max: Math.max(...dayItems.map((i) => i.main.temp_max)),
    temp_min: Math.min(...dayItems.map((i) => i.main.temp_min)),
    humidity: mainItem?.main.humidity ?? 60,
    pressure: mainItem?.main.pressure ?? 1013,
    wind_speed: mainItem?.wind.speed ?? 3,
    wind_deg: mainItem?.wind.deg ?? 0,
    condition: OW_ICON_MAP[icon] ?? "cloudy",
    precip_mm: totalRain,
    precip_prob: maxPop,
    uv_index: null,
    visibility: null,
  };
}

function normalizeWeatherAPICurrent(raw: unknown): NormalizedWeather {
  const r = raw as {
    current: {
      temp_c: number;
      feelslike_c: number;
      humidity: number;
      pressure_mb: number;
      wind_kph: number;
      wind_degree: number;
      condition: { code: number };
      precip_mm: number;
      uv: number;
      vis_km: number;
    };
  };
  const code = r.current.condition.code;
  const condition: WeatherCondition = WA_CODE_MAP[code] ?? "cloudy";
  return {
    temp: r.current.temp_c,
    feels_like: r.current.feelslike_c,
    temp_max: r.current.temp_c,
    temp_min: r.current.temp_c,
    humidity: r.current.humidity,
    pressure: r.current.pressure_mb,
    wind_speed: r.current.wind_kph / 3.6,
    wind_deg: r.current.wind_degree,
    condition,
    precip_mm: r.current.precip_mm,
    precip_prob: 0,
    uv_index: r.current.uv,
    visibility: r.current.vis_km * 1000,
  };
}

function normalizeWeatherAPIForecast(raw: unknown, dayIndex: number): NormalizedWeather {
  const r = raw as {
    forecast: {
      forecastday: Array<{
        day: {
          maxtemp_c: number;
          mintemp_c: number;
          avgtemp_c: number;
          maxwind_kph: number;
          avghumidity: number;
          daily_chance_of_rain: number;
          totalprecip_mm: number;
          uv: number;
          condition: { code: number };
          avgvis_km: number;
        };
      }>;
    };
  };
  const day = r.forecast.forecastday[dayIndex];
  if (!day) {
    return {
      temp: 20, feels_like: 18, temp_max: 22, temp_min: 18, humidity: 60, pressure: 1013,
      wind_speed: 3, wind_deg: 0, condition: "cloudy", precip_mm: 0, precip_prob: 0,
      uv_index: null, visibility: null,
    };
  }
  const code = day.day.condition.code;
  return {
    temp: day.day.avgtemp_c,
    feels_like: day.day.avgtemp_c,
    temp_max: day.day.maxtemp_c,
    temp_min: day.day.mintemp_c,
    humidity: day.day.avghumidity,
    pressure: 1013,
    wind_speed: day.day.maxwind_kph / 3.6,
    wind_deg: 0,
    condition: WA_CODE_MAP[code] ?? "cloudy",
    precip_mm: day.day.totalprecip_mm,
    precip_prob: day.day.daily_chance_of_rain,
    uv_index: day.day.uv,
    visibility: day.day.avgvis_km * 1000,
  };
}

function normalizeOpenMeteoCurrent(raw: unknown): NormalizedWeather {
  const r = raw as {
    current: {
      temperature_2m: number;
      apparent_temperature?: number;
      relative_humidity_2m: number;
      surface_pressure?: number;
      wind_speed_10m: number;
      wind_direction_10m?: number;
      weather_code: number;
      precipitation?: number;
      visibility?: number;
      uv_index?: number;
    };
  };
  const wmo = r.current.weather_code;
  const condition: WeatherCondition = WMO_MAP[wmo] ?? "cloudy";
  const temp = r.current.temperature_2m;
  return {
    temp,
    feels_like: r.current.apparent_temperature ?? temp,
    temp_max: temp,
    temp_min: temp,
    humidity: r.current.relative_humidity_2m,
    pressure: r.current.surface_pressure ?? 1013,
    wind_speed: r.current.wind_speed_10m,
    wind_deg: r.current.wind_direction_10m ?? 0,
    condition,
    precip_mm: r.current.precipitation ?? 0,
    precip_prob: 0,
    uv_index: r.current.uv_index ?? null,
    visibility: r.current.visibility ?? null,
  };
}

function normalizeOpenMeteoForecast(raw: unknown, dayIndex: number): NormalizedWeather {
  const r = raw as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      apparent_temperature_max?: number[];
      weather_code: number[];
      precipitation_sum: number[];
      precipitation_probability_max?: number[];
      wind_speed_10m_max: number[];
      wind_direction_10m_dominant?: number[];
      uv_index_max?: number[];
    };
  };
  const d = r.daily;
  const i = dayIndex;
  if (!d.time[i]) {
    return {
      temp: 20, feels_like: 18, temp_max: 22, temp_min: 18, humidity: 60, pressure: 1013,
      wind_speed: 3, wind_deg: 0, condition: "cloudy", precip_mm: 0, precip_prob: 0,
      uv_index: null, visibility: null,
    };
  }
  const tmax = d.temperature_2m_max[i] ?? 20;
  const tmin = d.temperature_2m_min[i] ?? 15;
  const wmo = d.weather_code[i] ?? 0;
  return {
    temp: (tmax + tmin) / 2,
    feels_like: d.apparent_temperature_max?.[i] ?? (tmax + tmin) / 2,
    temp_max: tmax,
    temp_min: tmin,
    humidity: 60,
    pressure: 1013,
    wind_speed: d.wind_speed_10m_max[i] ?? 3,
    wind_deg: d.wind_direction_10m_dominant?.[i] ?? 0,
    condition: WMO_MAP[wmo] ?? "cloudy",
    precip_mm: d.precipitation_sum[i] ?? 0,
    precip_prob: d.precipitation_probability_max?.[i] ?? 0,
    uv_index: d.uv_index_max?.[i] ?? null,
    visibility: null,
  };
}

// === HTTP Fetch Helpers ===

const FETCH_TIMEOUT_MS = 4000;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// === Provider Fetchers (current) ===

const WEATHER_PROXY_BASE = "https://weather-proxy.neisii.workers.dev";
const WEATHER_PROXY_API_KEY = process.env["WEATHER_PROXY_API_KEY"] ?? "";

async function fetchProxy(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "X-API-Key": WEATHER_PROXY_API_KEY },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOpenWeatherCurrent(cityId: string): Promise<NormalizedWeather> {
  const url = `${WEATHER_PROXY_BASE}/api/openweather/current?city=${cityId}`;
  const res = await fetchProxy(url);
  if (!res.ok) throw new Error(`OpenWeather ${res.status}`);
  const data = await res.json();
  return normalizeOpenWeatherCurrent(data);
}

async function fetchWeatherAPICurrent(cityId: string): Promise<NormalizedWeather> {
  const url = `${WEATHER_PROXY_BASE}/api/weatherapi/current?city=${cityId}`;
  const res = await fetchProxy(url);
  if (!res.ok) throw new Error(`WeatherAPI ${res.status}`);
  const data = await res.json();
  return normalizeWeatherAPICurrent(data);
}

async function fetchOpenMeteoCurrent(lat: number, lon: number): Promise<NormalizedWeather> {
  const url = `${WEATHER_PROXY_BASE}/api/openmeteo?lat=${lat}&lon=${lon}`;
  const res = await fetchProxy(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();
  return normalizeOpenMeteoCurrent(data);
}

// === Provider Fetchers (forecast) ===

async function fetchOpenWeatherForecast(cityId: string): Promise<NormalizedWeather[]> {
  const url = `${WEATHER_PROXY_BASE}/api/openweather/forecast?city=${cityId}`;
  const res = await fetchProxy(url);
  if (!res.ok) throw new Error(`OpenWeather forecast ${res.status}`);
  const data = await res.json();
  return [0, 1, 2].map((i) => normalizeOpenWeatherForecast(data, i));
}

async function fetchWeatherAPIForecast(cityId: string): Promise<NormalizedWeather[]> {
  const url = `${WEATHER_PROXY_BASE}/api/weatherapi/forecast?city=${cityId}`;
  const res = await fetchProxy(url);
  if (!res.ok) throw new Error(`WeatherAPI forecast ${res.status}`);
  const data = await res.json();
  return [0, 1, 2].map((i) => normalizeWeatherAPIForecast(data, i));
}

async function fetchOpenMeteoForecast(lat: number, lon: number): Promise<NormalizedWeather[]> {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `timezone=Asia%2FSeoul`,
    `daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max`,
    `forecast_days=3`,
  ].join("&");
  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Open-Meteo forecast ${res.status}`);
  const data = await res.json();
  return [0, 1, 2].map((i) => normalizeOpenMeteoForecast(data, i));
}

// === Aggregation ===

const DEFAULT_WEIGHTS = {
  temperature: { openmeteo: 0.45, openweather: 0.40, weatherapi: 0.15 },
  wind_speed: { openmeteo: 0.60, openweather: 0.25, weatherapi: 0.15 },
  humidity: { openmeteo: 0.00, openweather: 0.30, weatherapi: 0.70 },
  condition: { openmeteo: 0.00, openweather: 1.00, weatherapi: 0.00 },
};

function redistributeWeights(
  weights: Record<string, number>,
  failedProviders: Set<string>
): Record<string, number> {
  const active: string[] = [];
  let removedTotal = 0;
  for (const [p, w] of Object.entries(weights)) {
    if (failedProviders.has(p)) removedTotal += w;
    else active.push(p);
  }
  if (active.length === 0) return weights;
  const activeTotal = active.reduce((s, p) => s + weights[p], 0);
  const result: Record<string, number> = {};
  for (const [p, w] of Object.entries(weights)) {
    if (failedProviders.has(p)) result[p] = 0;
    else result[p] = activeTotal > 0 ? w + (removedTotal * (w / activeTotal)) : 1 / active.length;
  }
  return result;
}

function weightedAvg(values: Array<{ v: number; w: number }>): number {
  const totalW = values.reduce((s, x) => s + x.w, 0);
  if (totalW === 0) return 0;
  return values.reduce((s, x) => s + x.v * x.w, 0) / totalW;
}

function stddev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
}

function aggregateWeather(results: ProviderResult[]): AggregatedWeather {
  const successful = results.filter((r) => r.data !== null);
  const failed = results.filter((r) => r.data === null);

  if (successful.length === 0) {
    throw new Error("AllProvidersFailedError");
  }

  const failedSet = new Set(failed.map((r) => r.provider));

  const tempWeights = redistributeWeights(DEFAULT_WEIGHTS.temperature, failedSet);
  const windWeights = redistributeWeights(DEFAULT_WEIGHTS.wind_speed, failedSet);
  const humidWeights = redistributeWeights(DEFAULT_WEIGHTS.humidity, failedSet);
  const condWeights = redistributeWeights(DEFAULT_WEIGHTS.condition, failedSet);

  const temps = successful.map((r) => ({ v: r.data!.temp, w: tempWeights[r.provider] ?? 0 }));
  const feelsLikes = successful.map((r) => ({ v: r.data!.feels_like, w: tempWeights[r.provider] ?? 0 }));
  const maxTemps = successful.map((r) => ({ v: r.data!.temp_max, w: tempWeights[r.provider] ?? 0 }));
  const minTemps = successful.map((r) => ({ v: r.data!.temp_min, w: tempWeights[r.provider] ?? 0 }));
  const winds = successful.map((r) => ({ v: r.data!.wind_speed, w: windWeights[r.provider] ?? 0 }));
  const windDegs = successful.map((r) => ({ v: r.data!.wind_deg, w: windWeights[r.provider] ?? 0 }));
  const humids = successful.map((r) => ({ v: r.data!.humidity, w: humidWeights[r.provider] ?? 0 }));
  const pressures = successful.map((r) => ({ v: r.data!.pressure, w: 1 / successful.length }));
  const precipMms = successful.map((r) => ({ v: r.data!.precip_mm, w: 1 / successful.length }));
  const precipProbs = successful.map((r) => ({ v: r.data!.precip_prob, w: 1 / successful.length }));

  // Condition: use the provider with highest weight among successful
  let bestCondProvider = successful[0];
  for (const r of successful) {
    if ((condWeights[r.provider] ?? 0) > (condWeights[bestCondProvider?.provider ?? ""] ?? 0)) {
      bestCondProvider = r;
    }
  }
  const condition = bestCondProvider?.data?.condition ?? "cloudy";

  // UV: avg of available
  const uvValues = successful.filter((r) => r.data!.uv_index !== null).map((r) => r.data!.uv_index as number);
  const uv_index = uvValues.length > 0 ? uvValues.reduce((a, b) => a + b, 0) / uvValues.length : null;

  const visValues = successful.filter((r) => r.data!.visibility !== null).map((r) => r.data!.visibility as number);
  const visibility = visValues.length > 0 ? visValues.reduce((a, b) => a + b, 0) / visValues.length : null;

  const weather: NormalizedWeather = {
    temp: weightedAvg(temps),
    feels_like: weightedAvg(feelsLikes),
    temp_max: weightedAvg(maxTemps),
    temp_min: weightedAvg(minTemps),
    humidity: weightedAvg(humids),
    pressure: weightedAvg(pressures),
    wind_speed: weightedAvg(winds),
    wind_deg: weightedAvg(windDegs),
    condition,
    precip_mm: weightedAvg(precipMms),
    precip_prob: weightedAvg(precipProbs),
    uv_index,
    visibility,
  };

  // Confidence: 1 - normalized stddev
  const tempStd = stddev(successful.map((r) => r.data!.temp));
  const windStd = stddev(successful.map((r) => r.data!.wind_speed));
  const humidStd = stddev(successful.map((r) => r.data!.humidity));
  const tempConf = Math.max(0, 1 - tempStd / 5);
  const windConf = Math.max(0, 1 - windStd / 3);
  const humidConf = Math.max(0, 1 - humidStd / 20);

  return {
    weather,
    confidence: {
      temp: tempConf,
      wind: windConf,
      humidity: humidConf,
      overall: (tempConf + windConf + humidConf) / 3,
    },
    providers_used: successful.map((r) => r.provider),
    providers_failed: failed.map((r) => r.provider),
    incomplete_data: successful.length < 3,
    cached_at: new Date().toISOString(),
    provider_data: results.map((r) => ({
      provider: r.provider,
      data: r.data ?? {
        temp: 0, feels_like: 0, temp_max: 0, temp_min: 0, humidity: 0, pressure: 0,
        wind_speed: 0, wind_deg: 0, condition: "cloudy" as WeatherCondition, precip_mm: 0,
        precip_prob: 0, uv_index: null, visibility: null,
      },
      error: r.error,
    })),
  };
}

// === In-Memory Cache ===

interface CacheEntry<T> {
  data: T;
  expires_at: number;
}

const currentCache = new Map<string, CacheEntry<AggregatedWeather>>();
const forecastCache = new Map<string, CacheEntry<{ days: Array<{ date: string; weather: NormalizedWeather }>; providers_used: string[]; providers_failed: string[]; incomplete_data: boolean; cached_at: string }>>();

const CACHE_TTL_MS = 5 * 60 * 1000;

function isFresh<T>(entry: CacheEntry<T>): boolean {
  return Date.now() < entry.expires_at;
}

// === Routes ===

router.get("/weather/cities", (_req, res): void => {
  const data = GetCitiesResponse.parse({ cities: CITIES });
  res.json(data);
});

router.get("/weather/current", async (req, res): Promise<void> => {
  const parsed = GetWeatherCurrentQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "invalid_params", message: parsed.error.message, provider: null } });
    return;
  }

  const { cityId } = parsed.data;
  const city = getCityByName(cityId as string);
  if (!city) {
    res.status(400).json({ error: { code: "invalid_city", message: `지원하지 않는 도시: ${cityId}`, provider: null } });
    return;
  }

  const cacheKey = city.id;
  const cached = currentCache.get(cacheKey);
  if (cached && isFresh(cached)) {
    req.log.info({ cityId: city.id }, "Cache hit for current weather");
    res.json(GetWeatherCurrentResponse.parse(cached.data));
    return;
  }

  req.log.info({ cityId: city.id, lat: city.lat, lon: city.lon }, "Fetching current weather from providers");

  const [owResult, waResult, omResult] = await Promise.allSettled([
    fetchOpenWeatherCurrent(city.id),
    fetchWeatherAPICurrent(city.id),
    fetchOpenMeteoCurrent(city.lat, city.lon),
  ]);

  const results: ProviderResult[] = [
    {
      provider: "openweather",
      data: owResult.status === "fulfilled" ? owResult.value : null,
      error: owResult.status === "rejected" ? String(owResult.reason) : null,
    },
    {
      provider: "weatherapi",
      data: waResult.status === "fulfilled" ? waResult.value : null,
      error: waResult.status === "rejected" ? String(waResult.reason) : null,
    },
    {
      provider: "openmeteo",
      data: omResult.status === "fulfilled" ? omResult.value : null,
      error: omResult.status === "rejected" ? String(omResult.reason) : null,
    },
  ];

  const failed = results.filter((r) => r.error !== null);
  if (failed.length > 0) {
    req.log.warn({ failed: failed.map((f) => ({ provider: f.provider, error: f.error })) }, "Some providers failed");
  }

  let aggregated: AggregatedWeather;
  try {
    aggregated = aggregateWeather(results);
  } catch (err) {
    logger.error({ err, cityId: city.id }, "All providers failed for current weather");
    res.status(503).json({ error: { code: "provider_unavailable", message: "날씨 제공자에 모두 연결할 수 없습니다.", provider: null } });
    return;
  }

  currentCache.set(cacheKey, { data: aggregated, expires_at: Date.now() + CACHE_TTL_MS });

  res.json(GetWeatherCurrentResponse.parse(aggregated));
});

router.get("/weather/forecast", async (req, res): Promise<void> => {
  const parsed = GetWeatherForecastQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "invalid_params", message: parsed.error.message, provider: null } });
    return;
  }

  const { cityId, days = 3 } = parsed.data;
  const city = getCityByName(cityId as string);
  if (!city) {
    res.status(400).json({ error: { code: "invalid_city", message: `지원하지 않는 도시: ${cityId}`, provider: null } });
    return;
  }

  const cacheKey = `${city.id}:${days}`;
  const cached = forecastCache.get(cacheKey);
  if (cached && isFresh(cached)) {
    req.log.info({ cityId: city.id, days }, "Cache hit for forecast");
    res.json(GetWeatherForecastResponse.parse(cached.data));
    return;
  }

  req.log.info({ cityId: city.id, lat: city.lat, lon: city.lon, days }, "Fetching forecast from providers");

  const [owResult, waResult, omResult] = await Promise.allSettled([
    fetchOpenWeatherForecast(city.id),
    fetchWeatherAPIForecast(city.id),
    fetchOpenMeteoForecast(city.lat, city.lon),
  ]);

  const failedProviders: string[] = [];
  const successfulProviders: string[] = [];

  type DayWeathers = NormalizedWeather[];

  const owDays: DayWeathers | null = owResult.status === "fulfilled" ? owResult.value : null;
  const waDays: DayWeathers | null = waResult.status === "fulfilled" ? waResult.value : null;
  const omDays: DayWeathers | null = omResult.status === "fulfilled" ? omResult.value : null;

  if (!owDays) failedProviders.push("openweather"); else successfulProviders.push("openweather");
  if (!waDays) failedProviders.push("weatherapi"); else successfulProviders.push("weatherapi");
  if (!omDays) failedProviders.push("openmeteo"); else successfulProviders.push("openmeteo");

  if (successfulProviders.length === 0) {
    res.status(503).json({ error: { code: "provider_unavailable", message: "날씨 예보 제공자에 모두 연결할 수 없습니다.", provider: null } });
    return;
  }

  const numDays = Math.min(days ?? 3, 3);
  const today = new Date();

  const forecastDays = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0] ?? "";

    const perDayResults: ProviderResult[] = [
      { provider: "openweather", data: owDays?.[i] ?? null, error: owDays ? null : "failed" },
      { provider: "weatherapi", data: waDays?.[i] ?? null, error: waDays ? null : "failed" },
      { provider: "openmeteo", data: omDays?.[i] ?? null, error: omDays ? null : "failed" },
    ];

    let aggregated: AggregatedWeather;
    try {
      aggregated = aggregateWeather(perDayResults);
    } catch {
      aggregated = {
        weather: { temp: 20, feels_like: 18, temp_max: 22, temp_min: 18, humidity: 60, pressure: 1013, wind_speed: 3, wind_deg: 0, condition: "cloudy", precip_mm: 0, precip_prob: 0, uv_index: null, visibility: null },
        confidence: { temp: 0, wind: 0, humidity: 0, overall: 0 },
        providers_used: [], providers_failed: ["openweather", "weatherapi", "openmeteo"],
        incomplete_data: true, cached_at: null,
        provider_data: [],
      };
    }

    return { date: dateStr, weather: aggregated.weather };
  });

  const responseData = {
    days: forecastDays,
    providers_used: successfulProviders,
    providers_failed: failedProviders,
    incomplete_data: successfulProviders.length < 3,
    cached_at: new Date().toISOString(),
  };

  forecastCache.set(cacheKey, { data: responseData, expires_at: Date.now() + CACHE_TTL_MS });

  res.json(GetWeatherForecastResponse.parse(responseData));
});

export default router;
