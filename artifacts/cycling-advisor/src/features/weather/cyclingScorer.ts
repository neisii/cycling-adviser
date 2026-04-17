// Imports canonical types from the API schema — eliminates duplication with local definitions
import type { NormalizedWeather, WeatherCondition } from "@workspace/api-client-react";
import { OutfitEngine } from "./outfitEngine";

// Re-export so consumers can import everything from this module
export type { NormalizedWeather, WeatherCondition };

export type CyclingVerdict = "excellent" | "good" | "fair" | "poor" | "dangerous";

export interface ScoreBreakdown {
  temperature: number;
  wind: number;
  precipitation: number;
  humidity: number;
  uv: number;
}

export interface CyclingResult {
  score: number;
  verdict: CyclingVerdict;
  verdict_ko: string;
  score_breakdown: ScoreBreakdown;
  reasons_ko: string[];
  outfit: ReturnType<typeof OutfitEngine.recommend>;
}

const VERDICT_MAP: Record<CyclingVerdict, string> = {
  excellent: "최상",
  good: "좋음",
  fair: "보통",
  poor: "나쁨",
  dangerous: "위험",
};

function toVerdict(score: number): CyclingVerdict {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "poor";
  return "dangerous";
}

function isExtreme(weather: NormalizedWeather): boolean {
  return (
    weather.condition === "extreme" ||
    weather.condition === "blizzard" ||
    weather.condition === "thunderstorm"
  );
}

function scoreTemperature(temp: number): number {
  if (temp >= 10 && temp <= 24) return 0;
  if (temp < 10) {
    const penalty = (10 - temp) * 2.5;
    return -Math.min(penalty, 40);
  }
  const penalty = (temp - 24) * 2.5;
  return -Math.min(penalty, 40);
}

function scoreWind(windSpeed: number): number {
  if (windSpeed <= 6) return 0;
  const penalty = (windSpeed - 6) * 3.33;
  return -Math.min(penalty, 30);
}

function scorePrecipitation(weather: NormalizedWeather): number {
  const { condition } = weather;
  if (condition === "drizzle") return -15;
  if (condition === "light_rain") return -25;
  if (condition === "moderate_rain") return -40;
  if (condition === "heavy_rain" || condition === "thunderstorm") return -50;
  if (condition === "snow") return -35;
  return 0;
}

function scoreHumidity(humidity: number): number {
  if (humidity >= 30 && humidity <= 80) return 0;
  if (humidity > 80) {
    const penalty = ((humidity - 80) / 10) * 3;
    return -Math.min(penalty, 15);
  }
  const penalty = ((30 - humidity) / 10) * 3;
  return -Math.min(penalty, 15);
}

function scoreUV(uv: number | null): number {
  if (uv === null || uv <= 8) return 0;
  let penalty = -5;
  if (uv > 10) penalty -= 5;
  return penalty;
}

function buildReasonsKo(breakdown: ScoreBreakdown, weather: NormalizedWeather): string[] {
  const reasons: string[] = [];

  const temp = Math.round(weather.temp);
  if (breakdown.temperature === 0) {
    reasons.push(`기온 ${temp}°C — 라이딩 최적 조건`);
  } else if (weather.temp < -10) {
    reasons.push(`한파 경보 — 기온 ${temp}°C, 라이딩 금지`);
  } else if (weather.temp < 0) {
    reasons.push(`혹한 주의 — 기온 ${temp}°C, 완전 방한 장비 필요`);
  } else if (weather.temp > 30) {
    reasons.push(`폭염 주의 — 기온 ${temp}°C, 충분한 수분 보충 필수`);
  } else if (breakdown.temperature < -20) {
    reasons.push(`추운 날씨 — 기온 ${temp}°C, 방한 장비 착용 권장`);
  } else {
    reasons.push(`기온 ${temp}°C — 라이딩 가능 범위`);
  }

  const wind = Math.round(weather.wind_speed * 10) / 10;
  if (breakdown.wind < -20) {
    reasons.push(`강풍 ${wind}m/s — 라이딩 위험, 방풍 장비 필수`);
  } else if (breakdown.wind < -10) {
    reasons.push(`바람 ${wind}m/s — 방풍 재킷 권장`);
  } else if (breakdown.wind === 0) {
    reasons.push(`바람 약함 ${wind}m/s — 라이딩 쾌적`);
  }

  const { condition } = weather;
  if (condition === "drizzle") {
    reasons.push("이슬비 — 방수 장비 권장");
  } else if (condition === "light_rain") {
    reasons.push("가벼운 비 — 방수 재킷 필수");
  } else if (condition === "moderate_rain") {
    reasons.push("비 예보 — 방수 장비 완비 필요");
  } else if (condition === "heavy_rain") {
    reasons.push("강한 비 — 라이딩 자제 권장");
  } else if (condition === "thunderstorm") {
    reasons.push("뇌우 예보 — 라이딩 금지");
  } else if (condition === "snow") {
    reasons.push("눈 예보 — 노면 미끄러움, 라이딩 자제");
  } else if (condition === "clear") {
    reasons.push("맑은 날씨 — 라이딩 최적");
  } else if (condition === "partly_cloudy") {
    reasons.push("구름 조금 — 쾌적한 라이딩 조건");
  } else if (condition === "fog") {
    reasons.push("안개 — 시야 불량, 전후방 라이트 필수");
  }

  const uv = weather.uv_index;
  if (uv !== null && uv > 8) {
    reasons.push(`자외선 지수 ${uv} — 자외선차단제 필수`);
  }

  if (weather.precip_prob > 50) {
    reasons.push(`강수 확률 ${Math.round(weather.precip_prob)}% — 우천 대비 필요`);
  }

  return reasons;
}

const DANGEROUS_RESULT: CyclingResult = {
  score: 0,
  verdict: "dangerous",
  verdict_ko: "위험",
  score_breakdown: { temperature: 0, wind: 0, precipitation: -50, humidity: 0, uv: 0 },
  reasons_ko: ["극단적 기상 조건 — 라이딩 금지", "태풍/폭설/뇌우 등 극한 날씨"],
  outfit: null,
};

export const CyclingScorer = {
  score(weather: NormalizedWeather): CyclingResult {
    if (isExtreme(weather)) return DANGEROUS_RESULT;

    if (weather.temp < -10) {
      return {
        score: 0,
        verdict: "dangerous",
        verdict_ko: "위험",
        score_breakdown: { temperature: -40, wind: scoreWind(weather.wind_speed), precipitation: 0, humidity: 0, uv: 0 },
        reasons_ko: [`한파 경보 — 기온 ${Math.round(weather.temp)}°C, 라이딩 금지`, "동상 위험으로 외출 자제 권장"],
        outfit: null,
      };
    }

    const breakdown: ScoreBreakdown = {
      temperature: scoreTemperature(weather.temp),
      wind: scoreWind(weather.wind_speed),
      precipitation: scorePrecipitation(weather),
      humidity: scoreHumidity(weather.humidity),
      uv: scoreUV(weather.uv_index),
    };

    // Extra penalty for very strong wind
    if (weather.wind_speed > 15) {
      const extra = Math.max(0, (weather.wind_speed - 15) * 3);
      breakdown.wind = -Math.min(40, Math.abs(breakdown.wind) + extra);
    }

    const raw = 100 + Object.values(breakdown).reduce((a, b) => a + b, 0);
    const score = Math.max(0, Math.min(100, raw));
    const verdict = toVerdict(score);

    return {
      score,
      verdict,
      verdict_ko: VERDICT_MAP[verdict],
      score_breakdown: breakdown,
      reasons_ko: buildReasonsKo(breakdown, weather),
      outfit: OutfitEngine.recommend(weather),
    };
  },
};
