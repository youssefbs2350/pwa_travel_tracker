/**
 * Service météo pour les cartes de voyage
 * Utilise OpenWeatherMap API (gratuit, 1000 appels/jour)
 */

export interface TripWeatherData {
  current: {
    temp: number;
    feelsLike: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    temp: number;
    description: string;
    icon: string;
    precipitation: number;
  }>;
  alerts: Array<{
    type: 'rain' | 'storm' | 'heat' | 'cold';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Récupère la météo actuelle et prévisions 7 jours pour une destination
 * @param lat - Latitude de la destination
 * @param lon - Longitude de la destination
 * @returns Données météo complètes
 */
export async function fetchTripWeather(
  lat: number,
  lon: number
): Promise<TripWeatherData | null> {
  // Clé API OpenWeatherMap (gratuite)
  // IMPORTANT : En production, mettre dans les variables d'environnement
  const API_KEY = 'VOTRE_CLE_API_OPENWEATHERMAP'; // À remplacer
  
  try {
    // Météo actuelle
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
    );
    
    if (!currentRes.ok) {
      console.warn('[TripWeather] API call failed:', currentRes.status);
      return null;
    }

    const currentData = await currentRes.json();

    // Prévisions 7 jours
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
    );

    const forecastData = forecastRes.ok ? await forecastRes.json() : null;

    // Traitement des prévisions (1 par jour)
    const forecast: TripWeatherData['forecast'] = [];
    if (forecastData?.list) {
      const dailyData: Record<string, any> = {};
      
      forecastData.list.forEach((item: any) => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData[date]) {
          dailyData[date] = item;
        }
      });

      Object.entries(dailyData).slice(0, 7).forEach(([date, item]: [string, any]) => {
        forecast.push({
          date,
          temp: Math.round(item.main.temp),
          description: item.weather[0].description,
          icon: getWeatherIcon(item.weather[0].main),
          precipitation: item.pop ? Math.round(item.pop * 100) : 0
        });
      });
    }

    // Génération d'alertes intelligentes
    const alerts: TripWeatherData['alerts'] = [];
    
    // Alerte pluie
    if (forecast.some(day => day.precipitation > 70)) {
      alerts.push({
        type: 'rain',
        message: 'Forte probabilité de pluie dans les prochains jours',
        severity: 'medium'
      });
    }

    // Alerte chaleur
    if (currentData.main.temp > 35) {
      alerts.push({
        type: 'heat',
        message: 'Températures élevées - hydratez-vous régulièrement',
        severity: 'high'
      });
    }

    // Alerte froid
    if (currentData.main.temp < 5) {
      alerts.push({
        type: 'cold',
        message: 'Températures basses - prévoyez des vêtements chauds',
        severity: 'medium'
      });
    }

    // Alerte tempête
    if (currentData.weather[0].main === 'Thunderstorm') {
      alerts.push({
        type: 'storm',
        message: 'Orages en cours - activités outdoor déconseillées',
        severity: 'high'
      });
    }

    return {
      current: {
        temp: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        description: currentData.weather[0].description,
        icon: getWeatherIcon(currentData.weather[0].main),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6) // m/s vers km/h
      },
      forecast,
      alerts
    };
  } catch (error) {
    console.error('[TripWeather] Error fetching weather:', error);
    return null;
  }
}

/**
 * Mappe les codes météo OpenWeatherMap vers des icônes Lucide
 */
function getWeatherIcon(weatherMain: string): string {
  const iconMap: Record<string, string> = {
    Clear: 'Sun',
    Clouds: 'Cloud',
    Rain: 'CloudRain',
    Drizzle: 'CloudDrizzle',
    Thunderstorm: 'CloudLightning',
    Snow: 'CloudSnow',
    Mist: 'CloudFog',
    Fog: 'CloudFog',
    Haze: 'CloudFog'
  };

  return iconMap[weatherMain] || 'CloudSun';
}

/**
 * Version de démonstration avec données mockées
 * À utiliser si la clé API n'est pas configurée
 */
export async function fetchTripWeatherMock(
  _lat: number,
  _lon: number
): Promise<TripWeatherData> {
  // Simule un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    current: {
      temp: 24,
      feelsLike: 26,
      description: 'ensoleillé',
      icon: 'Sun',
      humidity: 65,
      windSpeed: 12
    },
    forecast: [
      { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], temp: 25, description: 'ensoleillé', icon: 'Sun', precipitation: 10 },
      { date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], temp: 23, description: 'nuageux', icon: 'Cloud', precipitation: 30 },
      { date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], temp: 22, description: 'pluie légère', icon: 'CloudRain', precipitation: 60 },
      { date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], temp: 26, description: 'ensoleillé', icon: 'Sun', precipitation: 5 },
      { date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], temp: 27, description: 'ensoleillé', icon: 'Sun', precipitation: 0 },
      { date: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0], temp: 28, description: 'très ensoleillé', icon: 'Sun', precipitation: 0 },
      { date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], temp: 24, description: 'nuageux', icon: 'CloudSun', precipitation: 20 }
    ],
    alerts: [
      {
        type: 'rain',
        message: 'Pluie prévue Jour +3 - reportez vos activités outdoor',
        severity: 'medium'
      }
    ]
  };
}
