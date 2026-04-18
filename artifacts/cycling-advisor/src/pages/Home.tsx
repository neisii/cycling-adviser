import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, Bike } from "lucide-react";

import { useCurrentWeather, useForecast } from "@/features/weather/hooks/useWeather";
import { useCyclingScore, useScoredForecast } from "@/features/weather/hooks/useCyclingScore";
import { useVerdictDisplay } from "@/features/weather/hooks/useVerdictDisplay";
import { useForecastSelection } from "@/features/forecast/hooks/useForecastSelection";

import { VerdictCard } from "@/features/weather/components/VerdictCard";
import { RidingBanner } from "@/features/weather/components/RidingBanner";
import { ForecastCardGrid } from "@/features/forecast/components/ForecastCardGrid";

import { getAllCities, type CityId } from "@/data/cities";
import { WeatherStats } from "@/components/WeatherStats";
import { OutfitSection } from "@/components/OutfitSection";
import { SkeletonCard } from "@/components/SkeletonCard";

const CITIES = getAllCities();
const DEFAULT_CITY: CityId = "seoul";

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<CityId>(DEFAULT_CITY);

  useEffect(() => {
    const saved = localStorage.getItem("cycling-advisor-city");
    if (saved && CITIES.find((c) => c.id === saved)) {
      setSelectedCity(saved as CityId);
    }
  }, []);

  const { data: currentData, isLoading: currentLoading, error: currentError } =
    useCurrentWeather(selectedCity);

  const { data: forecastData, isLoading: forecastLoading } =
    useForecast(selectedCity, 3);

  const cyclingResult = useCyclingScore(currentData?.weather);
  const forecastDays = forecastData?.days ?? [];
  const scoredForecastDays = useScoredForecast(forecastDays);

  const cityName = CITIES.find((c) => c.id === selectedCity)?.name_ko ?? selectedCity;
  const verdictUI = useVerdictDisplay(cyclingResult, currentData?.weather, cityName);

  const { selectedDayIndex, setSelectedDayIndex, activeDay } =
    useForecastSelection(scoredForecastDays);

  const handleCityChange = (cityId: CityId) => {
    setSelectedCity(cityId);
    localStorage.setItem("cycling-advisor-city", cityId);
    setSelectedDayIndex(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm">사이클링 날씨 어드바이저</span>
          </div>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value as CityId)}
              className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              data-testid="city-selector"
            >
              {CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name_ko}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {currentData?.incomplete_data && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm"
            data-testid="incomplete-data-warning"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              일부 날씨 제공자가 응답하지 않아 데이터가 불완전할 수 있습니다. (사용:{" "}
              {currentData.providers_used.join(", ")})
            </span>
          </div>
        )}

        {currentError && (
          <div
            className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            data-testid="error-state"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-semibold">날씨 정보를 가져올 수 없습니다</div>
              <div className="text-sm mt-0.5">
                잠시 후 다시 시도해 주세요. 모든 날씨 제공자에 연결할 수 없습니다.
              </div>
            </div>
          </div>
        )}

        {currentLoading && !currentData && (
          <div className="p-6 rounded-xl bg-card border border-card-border">
            <SkeletonCard />
          </div>
        )}

        {verdictUI?.isForbidden && <RidingBanner reason={verdictUI.forbiddenReason} />}

        {verdictUI && currentData && (
          <div className="space-y-4">
            <VerdictCard ui={verdictUI} />

            <WeatherStats weather={currentData.weather} />

            {scoredForecastDays.length > 0 ? (
              <div data-testid="forecast-section">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  3일 예보
                </h2>
                <ForecastCardGrid
                  days={scoredForecastDays}
                  selectedDayIndex={selectedDayIndex}
                  onSelect={setSelectedDayIndex}
                />
                {activeDay && (
                  <div className="mt-4" data-testid={`forecast-content-${selectedDayIndex}`}>
                    <OutfitSection result={activeDay.result} />
                  </div>
                )}
              </div>
            ) : (
              <div data-testid="today-outfit">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  오늘의 복장 추천
                </h2>
                <OutfitSection result={cyclingResult!} />
              </div>
            )}
          </div>
        )}

        {forecastLoading && (
          <div className="animate-pulse space-y-2" data-testid="forecast-loading">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 pb-6 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/70">Cycling Adviser · Ver 1.0</p>
        <p>
          created by{" "}
          <a
            href="https://github.com/neisii"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            @neisii
          </a>
        </p>
        <p>
          Bug reports &amp; inquiries:{" "}
          <a
            href="mailto:neisii@outlook.com"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            neisii@outlook.com
          </a>
        </p>
      </footer>
    </div>
  );
}
