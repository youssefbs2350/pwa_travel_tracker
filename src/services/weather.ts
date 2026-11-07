/**
 * Open-Meteo Weather Service
 * Service météo gratuit, sans clé d'API, basé sur les coordonnées GPS et la date du planning.
 */

export interface ActivityWeatherData {
  temperature: number;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
  label: string;
  emoji: string;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudRain' | 'CloudSnow' | 'CloudLightning' | 'CloudFog' | 'CloudDrizzle';
  isRainy: boolean;
  dateStr: string;
}

export function parseWmoWeather(code: number): {
  label: string;
  emoji: string;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudRain' | 'CloudSnow' | 'CloudLightning' | 'CloudFog' | 'CloudDrizzle';
  isRainy: boolean;
} {
  switch (code) {
    case 0:
      return { label: 'Ensoleillé', emoji: '☀️', iconName: 'Sun', isRainy: false };
    case 1:
      return { label: 'Dégagé', emoji: '🌤️', iconName: 'Sun', isRainy: false };
    case 2:
      return { label: 'Éclaircies', emoji: '⛅', iconName: 'CloudSun', isRainy: false };
    case 3:
      return { label: 'Nuageux', emoji: '☁️', iconName: 'Cloud', isRainy: false };
    case 45:
    case 48:
      return { label: 'Brouillard', emoji: '🌫️', iconName: 'CloudFog', isRainy: false };
    case 51:
    case 53:
    case 55:
      return { label: 'Bruine légère', emoji: '🌦️', iconName: 'CloudDrizzle', isRainy: true };
    case 61:
    case 63:
    case 65:
      return { label: 'Pluie', emoji: '🌧️', iconName: 'CloudRain', isRainy: true };
    case 71:
    case 73:
    case 75:
      return { label: 'Neige', emoji: '❄️', iconName: 'CloudSnow', isRainy: false };
    case 80:
    case 81:
    case 82:
      return { label: 'Averses', emoji: '🌧️', iconName: 'CloudRain', isRainy: true };
    case 95:
    case 96:
    case 99:
      return { label: 'Orages', emoji: '⛈️', iconName: 'CloudLightning', isRainy: true };
    default:
      return { label: 'Variable', emoji: '⛅', iconName: 'CloudSun', isRainy: false };
  }
}

// Cache mémoire pour éviter les requêtes en boucle
const weatherCache = new Map<string, ActivityWeatherData>();

/**
 * Récupère les prévisions météo pour une position et une date données.
 * Utilise l'API Open-Meteo (Open-Source, pas de clé requise).
 */
export async function fetchActivityWeather(
  latitude: number,
  longitude: number,
  targetDate?: string
): Promise<ActivityWeatherData | null> {
  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const roundedLat = latitude.toFixed(2);
  const roundedLon = longitude.toFixed(2);
  const todayStr = new Date().toISOString().split('T')[0];
  const dateKey = targetDate || todayStr;
  const cacheKey = `${roundedLat},${roundedLon},${dateKey}`;

  if (weatherCache.has(cacheKey)) {
    return weatherCache.get(cacheKey)!;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    let temp = Math.round(data.current_weather?.temperature ?? 20);
    let tempMax = temp;
    let tempMin = Math.max(0, temp - 5);
    let weatherCode = data.current_weather?.weathercode ?? 0;

    if (data.daily && Array.isArray(data.daily.time)) {
      const idx = data.daily.time.indexOf(dateKey);
      if (idx !== -1) {
        tempMax = Math.round(data.daily.temperature_2m_max[idx]);
        tempMin = Math.round(data.daily.temperature_2m_min[idx]);
        temp = tempMax;
        weatherCode = data.daily.weathercode[idx];
      } else if (data.daily.temperature_2m_max?.[0] !== undefined) {
        tempMax = Math.round(data.daily.temperature_2m_max[0]);
        tempMin = Math.round(data.daily.temperature_2m_min[0]);
        temp = tempMax;
        weatherCode = data.daily.weathercode[0];
      }
    }

    const info = parseWmoWeather(weatherCode);
    const result: ActivityWeatherData = {
      temperature: temp,
      tempMax,
      tempMin,
      weatherCode,
      label: info.label,
      emoji: info.emoji,
      iconName: info.iconName,
      isRainy: info.isRainy,
      dateStr: dateKey
    };

    weatherCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[Weather API] Erreur récupération météo:', err);
    return null;
  }
}
