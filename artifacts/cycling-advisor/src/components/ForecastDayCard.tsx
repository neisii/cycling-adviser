import { VERDICT_COLORS } from "@/lib/verdictColors";
import { WeatherIcon } from "./WeatherIcon";
import type { CyclingResult } from "@/features/weather/types";

interface ForecastDayCardProps {
  date: string;
  isToday: boolean;
  /** Pre-computed cycling score — obtained from useCyclingScore / useScoredForecast in the page layer */
  result: CyclingResult;
  condition: string;
  tempMin: number;
  tempMax: number;
}

export function ForecastDayCard({
  date,
  isToday,
  result,
  condition,
  tempMin,
  tempMax,
}: ForecastDayCardProps) {
  const colors = VERDICT_COLORS[result.verdict] ?? VERDICT_COLORS.fair;
  const dateObj = new Date(date + "T00:00:00");
  const dayName = isToday
    ? "오늘"
    : dateObj.toLocaleDateString("ko-KR", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div
      className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all`}
      data-testid={`forecast-day-${date}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-sm text-foreground">{dayName}</div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
        <div className="flex items-center gap-2">
          <WeatherIcon condition={condition} />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${colors.badge}`}>
            {result.verdict_ko}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold text-foreground text-lg">{Math.round(result.score)}</span>
        <span className="text-muted-foreground text-xs">점</span>
        <span className="text-foreground">
          {Math.round(tempMin)}°~ {Math.round(tempMax)}°
        </span>
      </div>
      {result.reasons_ko.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{result.reasons_ko[0]}</p>
      )}
    </div>
  );
}
