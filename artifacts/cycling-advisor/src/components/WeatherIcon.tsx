import { Sun, CloudRain, Wind, Snowflake, Zap } from "lucide-react";

interface WeatherIconProps {
  condition: string;
}

export function WeatherIcon({ condition }: WeatherIconProps) {
  if (condition === "clear" || condition === "partly_cloudy")
    return <Sun className="w-5 h-5 text-yellow-500" />;
  if (condition.includes("rain") || condition === "drizzle")
    return <CloudRain className="w-5 h-5 text-blue-500" />;
  if (condition === "thunderstorm")
    return <Zap className="w-5 h-5 text-purple-500" />;
  if (condition === "snow" || condition === "blizzard")
    return <Snowflake className="w-5 h-5 text-sky-400" />;
  return <Wind className="w-5 h-5 text-gray-400" />;
}
