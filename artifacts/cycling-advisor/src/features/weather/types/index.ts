// Single source of truth for all weather-domain types.
// API wire types come from the generated schema; domain types from the scorer.

export type {
  NormalizedWeather,
  WeatherCondition,
  WeatherResponse,
  ForecastResponse,
  ForecastDay,
} from "@workspace/api-client-react";

export type {
  CyclingResult,
  CyclingVerdict,
  ScoreBreakdown,
} from "../cyclingScorer";
