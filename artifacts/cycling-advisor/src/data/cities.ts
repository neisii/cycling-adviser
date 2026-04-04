export type CityId =
  | "seoul"
  | "busan"
  | "incheon"
  | "daegu"
  | "gwangju"
  | "daejeon"
  | "ulsan"
  | "jeju";

export interface City {
  id: CityId;
  name_ko: string;
  name_en: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { id: "seoul",   name_ko: "서울", name_en: "Seoul",   lat: 37.5665, lon: 126.9780 },
  { id: "busan",   name_ko: "부산", name_en: "Busan",   lat: 35.1796, lon: 129.0756 },
  { id: "incheon", name_ko: "인천", name_en: "Incheon", lat: 37.4563, lon: 126.7052 },
  { id: "daegu",   name_ko: "대구", name_en: "Daegu",   lat: 35.8714, lon: 128.6014 },
  { id: "gwangju", name_ko: "광주", name_en: "Gwangju", lat: 35.1595, lon: 126.8526 },
  { id: "daejeon", name_ko: "대전", name_en: "Daejeon", lat: 36.3504, lon: 127.3845 },
  { id: "ulsan",   name_ko: "울산", name_en: "Ulsan",   lat: 35.5384, lon: 129.3114 },
  { id: "jeju",    name_ko: "제주", name_en: "Jeju",    lat: 33.4996, lon: 126.5312 },
];

const NAME_MAP = new Map<string, City>(
  CITIES.flatMap((c) => [
    [c.id, c],
    [c.name_ko, c],
    [c.name_en, c],
    [c.name_en.toLowerCase(), c],
  ])
);

export function getCityById(id: CityId): City {
  const city = NAME_MAP.get(id);
  if (!city) throw new Error(`Unknown city id: ${id}`);
  return city;
}

export function getCityByName(name: string): City | null {
  return NAME_MAP.get(name) ?? NAME_MAP.get(name.toLowerCase()) ?? null;
}

export function getAllCities(): City[] {
  return CITIES;
}

export function isSupportedCity(name: string): boolean {
  return getCityByName(name) !== null;
}
