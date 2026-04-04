import { useState, useEffect } from "react";
import { useGetWeatherCurrent, useGetWeatherForecast, getGetWeatherCurrentQueryKey, getGetWeatherForecastQueryKey } from "@workspace/api-client-react";
import type { NormalizedWeather as ApiWeather } from "@workspace/api-client-react";
import { getAllCities, type CityId } from "@/data/cities";
import { CyclingScorer, type NormalizedWeather, type CyclingResult } from "@/services/cyclingScorer";
import { AlertTriangle, Wind, Droplets, Thermometer, Eye, Sun, ChevronDown, Bike, CloudRain, Snowflake, Zap } from "lucide-react";

const CITIES = getAllCities();

const DEFAULT_CITY: CityId = "seoul";

const VERDICT_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  excellent: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-500" },
  good:      { bg: "bg-lime-50 dark:bg-lime-900/20",     text: "text-lime-700 dark:text-lime-400",         border: "border-lime-200 dark:border-lime-800",     badge: "bg-lime-500" },
  fair:      { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-500",    border: "border-yellow-200 dark:border-yellow-800",  badge: "bg-yellow-500" },
  poor:      { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400",    border: "border-orange-200 dark:border-orange-800",  badge: "bg-orange-500" },
  dangerous: { bg: "bg-red-50 dark:bg-red-900/20",       text: "text-red-700 dark:text-red-400",          border: "border-red-200 dark:border-red-800",        badge: "bg-red-500" },
};

const INSULATION_KO: Record<string, string> = {
  none: "없음", light: "가벼운", medium: "중간", heavy: "두꺼운",
};

const WATERPROOF_KO: Record<string, string> = {
  none: "없음", water_resistant: "방수처리", waterproof: "완전방수",
};

const CATEGORY_KO: Record<string, string> = {
  head: "머리", torso: "상의", legs: "하의", feet: "발", extras: "악세서리",
};

function WeatherIcon({ condition }: { condition: string }) {
  if (condition === "clear" || condition === "partly_cloudy") return <Sun className="w-5 h-5 text-yellow-500" />;
  if (condition.includes("rain") || condition === "drizzle") return <CloudRain className="w-5 h-5 text-blue-500" />;
  if (condition === "thunderstorm") return <Zap className="w-5 h-5 text-purple-500" />;
  if (condition === "snow" || condition === "blizzard") return <Snowflake className="w-5 h-5 text-sky-400" />;
  return <Wind className="w-5 h-5 text-gray-400" />;
}

function ScoreCircle({ score, verdict }: { score: number; verdict: string }) {
  const colors = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.fair;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center" data-testid="score-circle">
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-muted opacity-30" />
          <circle
            cx="70" cy="70" r={radius} strokeWidth="10" fill="none"
            stroke={`hsl(var(--${verdict === "excellent" ? "chart-2" : verdict === "good" ? "chart-2" : verdict === "fair" ? "chart-3" : verdict === "poor" ? "chart-4" : "chart-5"}))`}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground" data-testid="score-value">{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className={`mt-2 px-4 py-1.5 rounded-full text-sm font-semibold text-white ${colors.badge}`} data-testid="verdict-badge">
        {verdict === "excellent" ? "최상" : verdict === "good" ? "좋음" : verdict === "fair" ? "보통" : verdict === "poor" ? "나쁨" : "위험"}
      </span>
    </div>
  );
}

function WeatherStats({ weather }: { weather: NormalizedWeather }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="weather-stats">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-card-border">
        <Thermometer className="w-4 h-4 text-primary shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">체감온도</div>
          <div className="text-sm font-medium">{Math.round(weather.feels_like)}°C</div>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-card-border">
        <Wind className="w-4 h-4 text-primary shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">풍속</div>
          <div className="text-sm font-medium">{Math.round(weather.wind_speed * 10) / 10}m/s</div>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-card-border">
        <Droplets className="w-4 h-4 text-primary shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">습도</div>
          <div className="text-sm font-medium">{Math.round(weather.humidity)}%</div>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-card-border">
        <CloudRain className="w-4 h-4 text-primary shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">강수확률</div>
          <div className="text-sm font-medium">{Math.round(weather.precip_prob)}%</div>
        </div>
      </div>
      {weather.uv_index !== null && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-card-border">
          <Sun className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">자외선</div>
            <div className="text-sm font-medium">{Math.round(weather.uv_index)}</div>
          </div>
        </div>
      )}
      {weather.visibility !== null && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-card-border">
          <Eye className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">가시거리</div>
            <div className="text-sm font-medium">{(weather.visibility / 1000).toFixed(1)}km</div>
          </div>
        </div>
      )}
    </div>
  );
}

function OutfitSection({ result }: { result: CyclingResult }) {
  if (!result.outfit) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-semibold text-center" data-testid="no-outfit-message">
        라이딩 금지 — 극단적 기상 조건으로 복장 추천을 제공할 수 없습니다.
      </div>
    );
  }

  const categories = [
    { key: "head" as const, items: result.outfit.head },
    { key: "torso" as const, items: result.outfit.torso },
    { key: "legs" as const, items: result.outfit.legs },
    { key: "feet" as const, items: result.outfit.feet },
    { key: "extras" as const, items: result.outfit.extras },
  ].filter((c) => c.items.length > 0);

  return (
    <div className="space-y-4" data-testid="outfit-section">
      {categories.map(({ key, items }) => (
        <div key={key}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{CATEGORY_KO[key]}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-card border border-card-border hover:shadow-sm transition-shadow"
                data-testid={`outfit-item-${item.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{item.name_ko}</span>
                      {item.required && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">필수</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.name_en}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.description_ko}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    보온: {INSULATION_KO[item.insulation_level]}
                  </span>
                  {item.waterproof !== "none" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {WATERPROOF_KO[item.waterproof]}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.material}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ForecastDayCard({ date, weather, isToday }: { date: string; weather: NormalizedWeather; isToday: boolean }) {
  const result = CyclingScorer.score(weather);
  const colors = VERDICT_COLORS[result.verdict] ?? VERDICT_COLORS.fair;
  const dateObj = new Date(date + "T00:00:00");
  const dayName = isToday ? "오늘" : dateObj.toLocaleDateString("ko-KR", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all`} data-testid={`forecast-day-${date}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-sm text-foreground">{dayName}</div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
        <div className="flex items-center gap-2">
          <WeatherIcon condition={weather.condition} />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${colors.badge}`}>
            {result.verdict_ko}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold text-foreground text-lg">{Math.round(result.score)}</span>
        <span className="text-muted-foreground text-xs">점</span>
        <span className="text-foreground">{Math.round(weather.temp_min)}°~ {Math.round(weather.temp_max)}°</span>
      </div>
      {result.reasons_ko.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{result.reasons_ko[0]}</p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse" data-testid="loading-skeleton">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="flex justify-center mb-6">
        <div className="w-36 h-36 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-3/5" />
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<CityId>(DEFAULT_CITY);
  const [activeTab, setActiveTab] = useState(0);

  // Load from localStorage on mount
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

  const { data: currentData, isLoading: currentLoading, error: currentError } = useGetWeatherCurrent(
    { cityId: selectedCity },
    { query: { queryKey: getGetWeatherCurrentQueryKey({ cityId: selectedCity }) } }
  );

  const { data: forecastData, isLoading: forecastLoading } = useGetWeatherForecast(
    { cityId: selectedCity, days: 3 },
    { query: { queryKey: getGetWeatherForecastQueryKey({ cityId: selectedCity, days: 3 }) } }
  );

  const selectedCityObj = CITIES.find((c) => c.id === selectedCity)!;

  let cyclingResult: CyclingResult | null = null;
  if (currentData?.weather) {
    cyclingResult = CyclingScorer.score(currentData.weather as NormalizedWeather);
  }

  const colors = cyclingResult ? (VERDICT_COLORS[cyclingResult.verdict] ?? VERDICT_COLORS.fair) : null;

  const forecastDays = forecastData?.days ?? [];

  const tabDates = [
    new Date().toISOString().split("T")[0] ?? "",
    new Date(Date.now() + 86400000).toISOString().split("T")[0] ?? "",
    new Date(Date.now() + 172800000).toISOString().split("T")[0] ?? "",
  ];

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
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm" data-testid="incomplete-data-warning">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>일부 날씨 제공자가 응답하지 않아 데이터가 불완전할 수 있습니다. (사용: {currentData.providers_used.join(", ")})</span>
          </div>
        )}

        {/* Error state */}
        {currentError && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" data-testid="error-state">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-semibold">날씨 정보를 가져올 수 없습니다</div>
              <div className="text-sm mt-0.5">잠시 후 다시 시도해 주세요. 모든 날씨 제공자에 연결할 수 없습니다.</div>
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
        {cyclingResult && cyclingResult.score === 0 && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-center" data-testid="extreme-weather-banner">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400 mb-1">라이딩 금지</div>
            <div className="text-sm text-red-600 dark:text-red-500">
              {cyclingResult.reasons_ko[0]}
            </div>
          </div>
        )}

        {/* Main verdict + weather */}
        {cyclingResult && currentData && (
          <div className="space-y-4">
            {/* Verdict card */}
            <div className={`p-6 rounded-xl border ${colors?.border ?? ""} ${colors?.bg ?? ""}`} data-testid="verdict-card">
              <div className="flex items-start gap-6">
                <ScoreCircle score={cyclingResult.score} verdict={cyclingResult.verdict} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-foreground">{Math.round(currentData.weather.temp)}°C</span>
                    <span className="text-sm text-muted-foreground">{selectedCityObj.name_ko}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    최고 {Math.round(currentData.weather.temp_max)}° / 최저 {Math.round(currentData.weather.temp_min)}°
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
            <WeatherStats weather={currentData.weather as NormalizedWeather} />

            {/* Forecast tabs */}
            {forecastDays.length > 0 && (
              <div data-testid="forecast-section">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">3일 예보</h2>
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

                {forecastDays[activeTab] && (
                  <div className="space-y-4" data-testid={`forecast-content-${activeTab}`}>
                    <ForecastDayCard
                      date={forecastDays[activeTab]?.date ?? tabDates[activeTab] ?? ""}
                      weather={forecastDays[activeTab]?.weather as NormalizedWeather}
                      isToday={activeTab === 0}
                    />
                    <OutfitSection result={CyclingScorer.score(forecastDays[activeTab]?.weather as NormalizedWeather)} />
                  </div>
                )}
              </div>
            )}

            {/* Today's outfit (only when on tab 0) */}
            {activeTab === 0 && forecastDays.length === 0 && (
              <div data-testid="today-outfit">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">오늘의 복장 추천</h2>
                <OutfitSection result={cyclingResult} />
              </div>
            )}
          </div>
        )}

        {/* 3-day overview when not loading */}
        {!currentLoading && forecastDays.length >= 3 && (
          <div data-testid="forecast-overview">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">주간 개요</h2>
            <div className="grid grid-cols-3 gap-2">
              {forecastDays.slice(0, 3).map((day, i) => (
                <button
                  key={day.date}
                  onClick={() => setActiveTab(i)}
                  className="text-left"
                  data-testid={`forecast-overview-${i}`}
                >
                  <ForecastDayCard
                    date={day.date}
                    weather={day.weather as NormalizedWeather}
                    isToday={i === 0}
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
              {[0, 1, 2].map((i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
