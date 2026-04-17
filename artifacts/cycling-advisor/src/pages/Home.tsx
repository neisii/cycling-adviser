import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, Bike } from "lucide-react";

import { useCurrentWeather, useForecast } from "@/features/weather/hooks/useWeather";
import { useCyclingScore, useScoredForecast } from "@/features/weather/hooks/useCyclingScore";
import { VERDICT_COLORS } from "@/lib/verdictColors";

import { getAllCities, type CityId } from "@/data/cities";
import { ScoreCircle } from "@/components/ScoreCircle";
import { WeatherStats } from "@/components/WeatherStats";
import { OutfitSection } from "@/components/OutfitSection";
import { ForecastDayCard } from "@/components/ForecastDayCard";
import { SkeletonCard } from "@/components/SkeletonCard";

const CITIES = getAllCities();
const DEFAULT_CITY: CityId = "seoul";

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<CityId>(DEFAULT_CITY);
  const [activeTab, setActiveTab] = useState(0);

  // Persist city selection in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cycling-advisor-city");
    if (saved && CITIES.find((c) => c.id === saved)) {
      setSelectedCity(saved as CityId);
    }
  }, []);

  const handleCityChange = (cityId: CityId) => {
    setSelectedCity(cityId);
    localStorage.setItem("cycling-advisor-city", cityId);
    setActiveTab(0);
  };

  const { data: currentData, isLoading: currentLoading, error: currentError } =
    useCurrentWeather(selectedCity);

  const { data: forecastData, isLoading: forecastLoading } =
    useForecast(selectedCity, 3);

  // --- All business logic lives in hooks, not in JSX ---
  const cyclingResult = useCyclingScore(currentData?.weather);
  const forecastDays = forecastData?.days ?? [];
  const scoredForecastDays = useScoredForecast(forecastDays);

  // Derived display values (colour look-up, not computation)
  const colors = cyclingResult
    ? (VERDICT_COLORS[cyclingResult.verdict] ?? VERDICT_COLORS.fair)
    : null;

  const selectedCityObj = CITIES.find((c) => c.id === selectedCity)!;

  const activeDay = scoredForecastDays[activeTab] ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm">사이클링 날씨 어드바이저</span>
          </div>

          {/* City Selector */}
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
        {/* Incomplete data warning */}
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

        {/* Error state */}
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

        {/* Loading state */}
        {currentLoading && !currentData && (
          <div className="p-6 rounded-xl bg-card border border-card-border">
            <SkeletonCard />
          </div>
        )}

        {/* Extreme weather banner */}
        {cyclingResult?.score === 0 && (
          <div
            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-center"
            data-testid="extreme-weather-banner"
          >
            <div className="text-2xl font-bold text-red-700 dark:text-red-400 mb-1">라이딩 금지</div>
            <div className="text-sm text-red-600 dark:text-red-500">{cyclingResult.reasons_ko[0]}</div>
          </div>
        )}

        {/* Main verdict + weather */}
        {cyclingResult && currentData && (
          <div className="space-y-4">
            {/* Verdict card */}
            <div
              className={`p-6 rounded-xl border ${colors?.border ?? ""} ${colors?.bg ?? ""}`}
              data-testid="verdict-card"
            >
              <div className="flex items-start gap-6">
                <ScoreCircle score={cyclingResult.score} verdict={cyclingResult.verdict} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-foreground">
                      {Math.round(currentData.weather.temp)}°C
                    </span>
                    <span className="text-sm text-muted-foreground">{selectedCityObj.name_ko}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    최고 {Math.round(currentData.weather.temp_max)}° / 최저{" "}
                    {Math.round(currentData.weather.temp_min)}°
                  </div>
                  <div className="space-y-1" data-testid="reasons-list">
                    {cyclingResult.reasons_ko.slice(0, 3).map((reason, i) => (
                      <div key={i} className={`text-sm ${colors?.text ?? "text-foreground"}`}>
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Weather details */}
            <WeatherStats weather={currentData.weather} />

            {/* Forecast tabs */}
            {scoredForecastDays.length > 0 && (
              <div data-testid="forecast-section">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  3일 예보
                </h2>
                <div className="flex gap-2 mb-3">
                  {["오늘", "내일", "모레"].map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-secondary"
                      }`}
                      data-testid={`forecast-tab-${i}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {activeDay && (
                  <div className="space-y-4" data-testid={`forecast-content-${activeTab}`}>
                    <ForecastDayCard
                      date={activeDay.date}
                      isToday={activeTab === 0}
                      result={activeDay.result}
                      condition={activeDay.weather.condition}
                      tempMin={activeDay.weather.temp_min}
                      tempMax={activeDay.weather.temp_max}
                    />
                    <OutfitSection result={activeDay.result} />
                  </div>
                )}
              </div>
            )}

            {/* Today's outfit (only when forecast is unavailable) */}
            {activeTab === 0 && scoredForecastDays.length === 0 && (
              <div data-testid="today-outfit">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  오늘의 복장 추천
                </h2>
                <OutfitSection result={cyclingResult} />
              </div>
            )}
          </div>
        )}

        {/* 3-day overview when not loading */}
        {!currentLoading && scoredForecastDays.length >= 3 && (
          <div data-testid="forecast-overview">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              주간 개요
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {scoredForecastDays.slice(0, 3).map((day, i) => (
                <button
                  key={day.date}
                  onClick={() => setActiveTab(i)}
                  className="text-left"
                  data-testid={`forecast-overview-${i}`}
                >
                  <ForecastDayCard
                    date={day.date}
                    isToday={i === 0}
                    result={day.result}
                    condition={day.weather.condition}
                    tempMin={day.weather.temp_min}
                    tempMax={day.weather.temp_max}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading forecast skeleton */}
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
