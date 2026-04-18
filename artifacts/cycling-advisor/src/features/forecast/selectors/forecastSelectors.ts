import type { ScoredForecastDay } from "@/features/weather/hooks/useCyclingScore";

/** Clamps index to valid range and returns the matching day, or null if days is empty. */
export function getSelectedDay(
  days: ScoredForecastDay[],
  index: number,
): ScoredForecastDay | null {
  if (days.length === 0) return null;
  const clamped = Math.max(0, Math.min(index, days.length - 1));
  return days[clamped] ?? null;
}
