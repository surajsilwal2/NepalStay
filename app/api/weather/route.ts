import { NextRequest, NextResponse } from "next/server";

// wttr.in is completely free, no API key, no rate limit for reasonable use
// Returns weather for any city in Nepal

const WEATHER_ICONS: Record<string, string> = {
  "113": "☀️", // Sunny
  "116": "⛅", // Partly Cloudy
  "119": "☁️", // Cloudy
  "122": "🌫️", // Overcast
  "143": "🌫️", // Mist
  "176": "🌦️", // Patchy rain
  "179": "🌨️", // Patchy snow
  "182": "🌧️", // Sleet
  "185": "🌧️", // Freezing drizzle
  "200": "⛈️", // Thunder
  "227": "🌨️", // Blowing snow
  "230": "❄️", // Blizzard
  "248": "🌫️", // Fog
  "260": "🌫️", // Freezing fog
  "263": "🌦️", // Light drizzle
  "266": "🌧️", // Drizzle
  "281": "🌧️", // Freezing drizzle
  "284": "🌧️", // Heavy freezing drizzle
  "293": "🌦️", // Light rain
  "296": "🌧️", // Moderate rain
  "299": "🌧️", // Heavy rain
  "302": "🌧️", // Moderate rain
  "305": "🌧️", // Heavy rain
  "308": "⛈️", // Very heavy rain
  "311": "🌧️", // Sleet
  "314": "🌨️", // Moderate sleet
  "317": "🌨️", // Light sleet showers
  "320": "🌨️", // Moderate sleet
  "323": "🌨️", // Light snow
  "326": "❄️", // Light snow showers
  "329": "❄️", // Moderate snow
  "332": "❄️", // Moderate snow
  "335": "❄️", // Heavy snow
  "338": "❄️", // Heavy snow
  "350": "🌨️", // Ice pellets
  "353": "🌦️", // Light rain shower
  "356": "🌧️", // Moderate rain shower
  "359": "⛈️", // Torrential rain shower
  "362": "🌨️", // Light sleet showers
  "365": "🌨️", // Moderate sleet showers
  "368": "🌨️", // Light snow showers
  "371": "❄️", // Moderate snow showers
  "374": "🌨️", // Light sleet showers
  "377": "🌨️", // Moderate sleet showers
  "386": "⛈️", // Patchy thunder
  "389": "⛈️", // Moderate thunder
  "392": "⛈️", // Patchy light snow thunder
  "395": "⛈️", // Moderate snow thunder
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "Kathmandu";

    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
      {
        headers: { "User-Agent": "NepalStay/1.0 (nepal hotel booking)" },
        next: { revalidate: 1800 }, // cache 30 minutes
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Weather unavailable" },
        { status: 502 },
      );
    }

    const data = await res.json();

    const current = data.current_condition?.[0];
    const today = data.weather?.[0];
    const tomorrow = data.weather?.[1];
    const dayAfter = data.weather?.[2];

    if (!current) {
      return NextResponse.json(
        { success: false, error: "No weather data" },
        { status: 502 },
      );
    }

    const weatherCode = current.weatherCode;
    const icon = WEATHER_ICONS[weatherCode] || "🌤️";

    const weatherCondition = current.weatherDesc?.[0]?.value || "Clear";

    return NextResponse.json({
      success: true,
      data: {
        city,
        current: {
          tempC: parseInt(current.temp_C),
          tempF: parseInt(current.temp_F),
          feelsLikeC: parseInt(current.FeelsLikeC),
          humidity: parseInt(current.humidity),
          visibility: parseInt(current.visibility),
          windKmph: parseInt(current.windspeedKmph),
          description: weatherCondition,
          icon,
          uvIndex: parseInt(current.uvIndex || "0"),
          cloudcover: parseInt(current.cloudcover),
        },
        forecast: [today, tomorrow, dayAfter]
          .filter(Boolean)
          .map((day: any, i: number) => ({
            day: i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Day 3",
            maxC: parseInt(day.maxtempC),
            minC: parseInt(day.mintempC),
            icon: WEATHER_ICONS[day.hourly?.[4]?.weatherCode] || "🌤️",
            sunrise: day.astronomy?.[0]?.sunrise || "",
            sunset: day.astronomy?.[0]?.sunset || "",
          })),
      },
    });
  } catch (error) {
    console.error("[WEATHER]", error);
    return NextResponse.json(
      { success: false, error: "Weather service unavailable" },
      { status: 500 },
    );
  }
}
