import { VERDICT_COLORS } from "@/lib/verdictColors";
import type { CyclingResult } from "@/features/weather/cyclingScorer";
import type { NormalizedWeather } from "@workspace/api-client-react";

const MAX_REASONS = 3;

export interface VerdictColors {
  bg: string;
  text: string;
  border: string;
  badge: string;
}

export interface VerdictUIModel {
  score: number;
  verdict: string;
  verdictKo: string;
  colors: VerdictColors;
  temp: number;
  tempMax: number;
  tempMin: number;
  cityName: string;
  reasons: string[];
  isForbidden: boolean;
  forbiddenReason: string;
}

export function mapCyclingResultToUI(
  result: CyclingResult,
  weather: NormalizedWeather,
  cityName: string,
): VerdictUIModel {
  const reasons = result.reasons_ko.slice(0, MAX_REASONS);
  return {
    score: result.score,
    verdict: result.verdict,
    verdictKo: result.verdict_ko,
    colors: VERDICT_COLORS[result.verdict] ?? VERDICT_COLORS.fair,
    temp: weather.temp,
    tempMax: weather.temp_max,
    tempMin: weather.temp_min,
    cityName,
    reasons,
    isForbidden: result.score === 0,
    forbiddenReason: result.reasons_ko[0] ?? "",
  };
}
