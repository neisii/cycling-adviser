import { useMemo } from "react";
import { CyclingScorer } from "@/features/weather/cyclingScorer";
import type { NormalizedWeather, CyclingResult, ForecastDay } from "@/features/weather/types";

/**
 * Scores a single weather snapshot.
 * Returns null when weather data is not yet available.
 * Recomputes only when the weather object reference changes (React Query
 * returns stable references between polls).
 */
export function useCyclingScore(
  weather: NormalizedWeather | null | undefined,
): CyclingResult | null {
  return useMemo(
    () => (weather ? CyclingScorer.score(weather) : null),
    [weather],
  );
}

export interface ScoredForecastDay {
  date: string;
  weather: NormalizedWeather;
  result: CyclingResult;
}

/**
 * Scores all days in a forecast list in one memoized pass.
 * Avoids re-scoring on every render and eliminates CyclingScorer calls
 * from render loops in the page layer.
 */
export function useScoredForecast(days: ForecastDay[]): ScoredForecastDay[] {
  return useMemo(
    () =>
      days.map((day) => ({
        date: day.date,
        weather: day.weather as NormalizedWeather,
        result: CyclingScorer.score(day.weather as NormalizedWeather),
      })),
    [days],
  );
}
