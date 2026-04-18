import { ForecastDayCard } from "@/features/forecast/components/ForecastDayCard";
import type { ScoredForecastDay } from "@/features/weather/hooks/useCyclingScore";

interface ForecastCardGridProps {
  days: ScoredForecastDay[];
  selectedDayIndex: number;
  onSelect: (index: number) => void;
}

export function ForecastCardGrid({ days, selectedDayIndex, onSelect }: ForecastCardGridProps) {
  if (days.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {days.slice(0, 3).map((day, i) => (
        <button
          key={day.date}
          onClick={() => onSelect(i)}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          data-testid={`forecast-card-${i}`}
        >
          <ForecastDayCard
            date={day.date}
            isToday={i === 0}
            isActive={selectedDayIndex === i}
            result={day.result}
            condition={day.weather.condition}
            tempMin={day.weather.temp_min}
            tempMax={day.weather.temp_max}
          />
        </button>
      ))}
    </div>
  );
}
