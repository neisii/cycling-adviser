import {
  useGetWeatherCurrent,
  useGetWeatherForecast,
  getGetWeatherCurrentQueryKey,
  getGetWeatherForecastQueryKey,
} from "@workspace/api-client-react";
import type { CityId } from "@workspace/api-client-react";

/**
 * Fetches current weather for a city.
 * Encapsulates query key construction so callers don't need to import the low-level helpers.
 */
export function useCurrentWeather(cityId: CityId) {
  return useGetWeatherCurrent(
    { cityId },
    { query: { queryKey: getGetWeatherCurrentQueryKey({ cityId }) } },
  );
}

/**
 * Fetches a multi-day forecast for a city.
 */
export function useForecast(cityId: CityId, days = 3) {
  return useGetWeatherForecast(
    { cityId, days },
    { query: { queryKey: getGetWeatherForecastQueryKey({ cityId, days }) } },
  );
}
