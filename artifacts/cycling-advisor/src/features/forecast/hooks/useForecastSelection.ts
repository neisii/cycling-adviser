import { useState } from "react";
import type { ScoredForecastDay } from "@/features/weather/hooks/useCyclingScore";
import { getSelectedDay } from "@/features/forecast/selectors/forecastSelectors";

export interface ForecastSelection {
  selectedDayIndex: number;
  setSelectedDayIndex: (index: number) => void;
  activeDay: ScoredForecastDay | null;
}

export function useForecastSelection(days: ScoredForecastDay[]): ForecastSelection {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const clamped = days.length > 0 ? Math.max(0, Math.min(selectedDayIndex, days.length - 1)) : 0;
  const activeDay = getSelectedDay(days, clamped);
  return { selectedDayIndex: clamped, setSelectedDayIndex, activeDay };
}
