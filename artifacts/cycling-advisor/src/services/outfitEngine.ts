import { type OutfitItem, getItem } from "../data/outfitCatalog";
import type { NormalizedWeather, WeatherCondition } from "./cyclingScorer";

export interface OutfitRecommendation {
  head: OutfitItem[];
  torso: OutfitItem[];
  legs: OutfitItem[];
  feet: OutfitItem[];
  extras: OutfitItem[];
}

function isRainy(condition: WeatherCondition): boolean {
  return (
    condition === "drizzle" ||
    condition === "light_rain" ||
    condition === "moderate_rain" ||
    condition === "heavy_rain"
  );
}

function selectTorsoLayers(temp: number, windSpeed: number): OutfitItem[] {
  const items: OutfitItem[] = [];

  if (temp > 24) {
    items.push(getItem("short_sleeve_jersey"));
  } else if (temp >= 16) {
    items.push(getItem("short_sleeve_jersey"));
    if (temp < 20) {
      items.push(getItem("arm_warmers"));
    }
  } else if (temp >= 10) {
    items.push(getItem("short_sleeve_jersey"));
    items.push(getItem("arm_warmers"));
    if (windSpeed > 5) {
      items.push(getItem("wind_vest"));
    }
  } else if (temp >= 5) {
    items.push(getItem("long_sleeve_jersey"));
    if (windSpeed > 5 || temp < 8) {
      items.push(getItem("windproof_jacket"));
    } else {
      items.push(getItem("thermal_vest"));
    }
  } else if (temp >= 0) {
    items.push(getItem("base_layer"));
    items.push(getItem("thermal_jersey"));
    items.push(getItem("windproof_jacket"));
  } else {
    items.push(getItem("base_layer"));
    items.push(getItem("thermal_jersey"));
    items.push(getItem("windproof_jacket"));
  }

  return items;
}

function selectLegsLayers(temp: number): OutfitItem[] {
  if (temp > 16) {
    return [getItem("bib_shorts")];
  } else if (temp >= 10) {
    return [getItem("bib_shorts"), getItem("knee_warmers")];
  } else {
    return [getItem("thermal_bib_tights")];
  }
}

function selectFeet(temp: number, condition: WeatherCondition): OutfitItem[] {
  if (isRainy(condition)) {
    return [getItem("waterproof_overshoes")];
  }
  if (temp < 10) {
    return [getItem("overshoes")];
  } else if (temp <= 15) {
    return [getItem("thick_cycling_socks")];
  } else {
    return [getItem("cycling_socks")];
  }
}

export const OutfitEngine = {
  recommend(weather: NormalizedWeather): OutfitRecommendation | null {
    if (weather.condition === "extreme" || weather.condition === "blizzard") {
      return null;
    }

    const items: OutfitItem[] = [];

    // Head
    items.push(getItem("helmet"));

    if (weather.temp < 0) {
      items.push(getItem("winter_cap"));
      items.push(getItem("ear_warmers"));
    } else if (weather.temp < 5) {
      items.push(getItem("winter_cap"));
    } else if ((weather.uv_index ?? 0) > 6) {
      items.push(getItem("sun_cap"));
      items.push(getItem("sunglasses"));
    } else if ((weather.uv_index ?? 0) > 3) {
      items.push(getItem("sunglasses"));
    } else if (weather.condition === "fog") {
      items.push(getItem("cycling_glasses_clear"));
    }

    // Torso
    items.push(...selectTorsoLayers(weather.temp, weather.wind_speed));

    // Rain override for torso
    if (isRainy(weather.condition) || weather.condition === "thunderstorm") {
      if (!items.find((i) => i.id === "waterproof_jacket")) {
        items.push(getItem("waterproof_jacket"));
      }
    }

    // Wind override
    if (weather.wind_speed > 8 && !items.find((i) => i.id === "windproof_jacket")) {
      items.push(getItem("windproof_jacket"));
    }

    // Legs
    items.push(...selectLegsLayers(weather.temp));

    // Feet
    items.push(...selectFeet(weather.temp, weather.condition));

    // Extras
    if ((weather.uv_index ?? 0) > 3) {
      items.push(getItem("sunscreen"));
    }

    if (weather.condition === "fog") {
      items.push(getItem("front_rear_light"));
    }

    if (weather.temp < 5) {
      items.push(getItem("winter_gloves"));
      items.push(getItem("neck_warmer"));
    } else {
      items.push(getItem("summer_gloves"));
    }

    if (weather.temp < 0) {
      items.push(getItem("ear_warmers"));
    }

    if (isRainy(weather.condition)) {
      items.push(getItem("rain_cover"));
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Group by category
    const head = unique.filter((i) => i.category === "head");
    const torso = unique.filter((i) => i.category === "torso");
    const legs = unique.filter((i) => i.category === "legs");
    const feet = unique.filter((i) => i.category === "feet");
    const extras = unique.filter((i) => i.category === "extra");

    return { head, torso, legs, feet, extras };
  },
};
