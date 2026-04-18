import { useMemo } from "react";
import { mapCyclingResultToUI, type VerdictUIModel } from "@/features/weather/mappers/verdictMapper";
import type { CyclingResult } from "@/features/weather/cyclingScorer";
import type { NormalizedWeather } from "@workspace/api-client-react";

export type { VerdictUIModel };

export function useVerdictDisplay(
  result: CyclingResult | null,
  weather: NormalizedWeather | undefined,
  cityName: string,
): VerdictUIModel | null {
  return useMemo(
    () => (result && weather ? mapCyclingResultToUI(result, weather, cityName) : null),
    [result, weather, cityName],
  );
}
