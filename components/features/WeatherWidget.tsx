"use client";
import { useEffect, useState } from "react";
import {
  Wind,
  Droplets,
  Eye,
  Thermometer,
  Sunrise,
  Sunset,
} from "lucide-react";

interface WeatherData {
  city: string;
  current: {
    tempC: number;
    tempF: number;
    feelsLikeC: number;
    humidity: number;
    visibility: number;
    windKmph: number;
    description: string;
    icon: string;
    uvIndex: number;
    cloudcover: number;
  };
  forecast: Array<{
    day: string;
    maxC: number;
    minC: number;
    icon: string;
    sunrise: string;
    sunset: string;
  }>;
}

interface Props {
  city: string;
}

function Skeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-5 border border-blue-100 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-200 rounded-xl" />
        <div className="space-y-1.5">
          <div className="h-5 bg-blue-200 rounded w-20" />
          <div className="h-4 bg-blue-100 rounded w-28" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-blue-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function WeatherWidget({ city }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setWeather(d.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) return <Skeleton />;
  if (error || !weather) return null;

  const { current, forecast } = weather;

  // UV index label
  const uvLabel =
    current.uvIndex <= 2
      ? "Low"
      : current.uvIndex <= 5
        ? "Moderate"
        : current.uvIndex <= 7
          ? "High"
          : "Very High";
  const uvColor =
    current.uvIndex <= 2
      ? "text-green-600"
      : current.uvIndex <= 5
        ? "text-yellow-600"
        : current.uvIndex <= 7
          ? "text-orange-600"
          : "text-red-600";

  return (
    <div className="bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl p-5 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-4xl">{current.icon}</span>
            <div>
              <p className="text-3xl font-bold">{current.tempC}°C</p>
              <p className="text-sm text-blue-100 capitalize">
                {current.description}
              </p>
            </div>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Feels like {current.feelsLikeC}°C · {city}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-200 uppercase tracking-wide font-semibold">
            Live Weather
          </p>
          <p className="text-xs text-blue-300 mt-0.5">Updated 30 min</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { icon: Droplets, val: `${current.humidity}%`, label: "Humidity" },
          { icon: Wind, val: `${current.windKmph} km/h`, label: "Wind" },
          { icon: Eye, val: `${current.visibility} km`, label: "Visibility" },
          { icon: Thermometer, val: uvLabel, label: "UV Index", cls: uvColor },
        ].map(({ icon: Icon, val, label, cls }) => (
          <div key={label} className="bg-white/15 rounded-xl p-2 text-center">
            <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-blue-100" />
            <p className={`text-xs font-bold ${cls || "text-white"}`}>{val}</p>
            <p className="text-xs text-blue-200">{label}</p>
          </div>
        ))}
      </div>

      {/* 3-day forecast */}
      <div className="grid grid-cols-3 gap-2">
        {forecast.map((day) => (
          <div
            key={day.day}
            className="bg-white/15 rounded-xl p-2.5 text-center"
          >
            <p className="text-xs text-blue-200 font-medium mb-1">{day.day}</p>
            <span className="text-2xl">{day.icon}</span>
            <div className="mt-1 flex items-center justify-center gap-1">
              <span className="text-xs font-bold text-white">{day.maxC}°</span>
              <span className="text-xs text-blue-300">{day.minC}°</span>
            </div>
            {day.day === "Today" && day.sunrise && (
              <div className="mt-1 space-y-0.5">
                <p className="text-xs text-blue-200 flex items-center justify-center gap-1">
                  <span>🌅</span>
                  {day.sunrise}
                </p>
                <p className="text-xs text-blue-200 flex items-center justify-center gap-1">
                  <span>🌇</span>
                  {day.sunset}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-blue-300 text-center mt-3">
        ☔ Check weather before your trip · Data by wttr.in
      </p>
    </div>
  );
}
