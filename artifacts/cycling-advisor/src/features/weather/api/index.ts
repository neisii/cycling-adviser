// Centralised weather API layer — wraps the generated API client
// Components and hooks should import from here, not directly from @workspace/api-client-react
export {
  getWeatherCurrent as getCurrentWeather,
  getWeatherForecast as getForecast,
  getCities,
} from "@workspace/api-client-react";

export type {
  WeatherResponse,
  ForecastResponse,
  ForecastDay,
  CitiesResponse,
} from "@workspace/api-client-react";
