import React, { useEffect, useState } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, CloudSun,
  Droplets, Wind, AlertTriangle, Loader
} from 'lucide-react';
import { Trip } from '../../types';
import { fetchTripWeatherMock, type TripWeatherData } from '../../services/tripWeather';

interface TripWeatherWidgetProps {
  trip: Trip;
  latitude?: number;
  longitude?: number;
}

const WeatherIcon: React.FC<{ iconName: string; className?: string }> = ({ iconName, className = "w-8 h-8" }) => {
  const icons: Record<string, React.ReactNode> = {
    Sun: <Sun className={className} />,
    Cloud: <Cloud className={className} />,
    CloudRain: <CloudRain className={className} />,
    CloudSnow: <CloudSnow className={className} />,
    CloudLightning: <CloudLightning className={className} />,
    CloudFog: <CloudFog className={className} />,
    CloudDrizzle: <CloudDrizzle className={className} />,
    CloudSun: <CloudSun className={className} />
  };
  
  return <>{icons[iconName] || <Sun className={className} />}</>;
};

export const TripWeatherWidget: React.FC<TripWeatherWidgetProps> = ({ trip, latitude, longitude }) => {
  const [weather, setWeather] = useState<TripWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    loadWeather();
  }, [trip.id, latitude, longitude]);

  const loadWeather = async () => {
    setIsLoading(true);
    try {
      // Utilise les coordonnées ou des coordonnées par défaut
      const lat = latitude || 35.5;
      const lon = longitude || 10.8;
      
      // Utilise la version mock pour la démo
      // En production : remplacer par fetchTripWeather(lat, lon)
      const data = await fetchTripWeatherMock(lat, lon);
      setWeather(data);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center h-32">
        <Loader className="w-6 h-6 text-slate-600 animate-spin" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
        Météo non disponible
      </div>
    );
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-900 border border-sky-800/30 overflow-hidden">
      {/* Current Weather */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <WeatherIcon iconName={weather.current.icon} className="w-10 h-10 text-sky-400" />
            <div>
              <div className="text-3xl font-bold text-white">{weather.current.temp}°C</div>
              <div className="text-xs text-slate-400 capitalize">{weather.current.description}</div>
            </div>
          </div>
          
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/10 rounded-lg border border-sky-500/30 transition-colors"
          >
            {showForecast ? 'Masquer' : 'Prévisions'}
          </button>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>{weather.current.humidity}%</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="text-[10px] text-slate-400">Ressenti:</span>
            <span>{weather.current.feelsLike}°C</span>
          </div>
        </div>

        {/* Alerts */}
        {weather.alerts.length > 0 && (
          <div className="space-y-1.5">
            {weather.alerts.map((alert, idx) => (
              <div key={idx} className={`flex items-start space-x-2 p-2 rounded-lg text-xs border ${getAlertColor(alert.severity)}`}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7-Day Forecast */}
      {showForecast && (
        <div className="border-t border-sky-800/30 p-3 bg-slate-950/40">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Prévisions 7 jours</h4>
          <div className="space-y-2">
            {weather.forecast.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <WeatherIcon iconName={day.icon} className="w-5 h-5 text-sky-400" />
                  <span className="text-slate-300 w-20">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 capitalize text-[11px]">{day.description}</span>
                  <span className="font-bold text-white w-8 text-right">{day.temp}°</span>
                  {day.precipitation > 0 && (
                    <div className="flex items-center space-x-1 text-sky-400">
                      <Droplets className="w-3 h-3" />
                      <span className="text-[10px]">{day.precipitation}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
