export interface WeatherData {
  temperature: number;    // °F
  humidity: number;       // %
  precipitation: number;  // mm
  weatherCode: number;
  weatherDescription: string;
  season: string;
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Rain showers";
  return "Stormy";
}

export function getCurrentSeason(): string {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export async function fetchWeather(): Promise<WeatherData> {
  // 1. Get geolocation
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
    else navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
  });

  const { latitude, longitude } = position.coords;

  // 2. Fetch from Open-Meteo
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weathercode&timezone=auto&temperature_unit=fahrenheit`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather");
  const data = await res.json();

  const current = data.current;
  const code = current.weathercode;

  return {
    temperature: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    weatherCode: code,
    weatherDescription: getWeatherDescription(code),
    season: getCurrentSeason(),
  };
}

export function getWeatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  return "⛈️";
}
