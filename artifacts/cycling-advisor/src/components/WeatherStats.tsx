import { Thermometer, Wind, Droplets, CloudRain, Sun, Eye } from "lucide-react";
import type { NormalizedWeather } from "@/features/weather/types";

interface WeatherStatsProps {
  weather: NormalizedWeather;
}

export function WeatherStats({ weather }: WeatherStatsProps) {
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
