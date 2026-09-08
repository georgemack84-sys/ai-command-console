#!/usr/bin/env node

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const usage = `Usage:
  npm run weather
  npm run weather -- --city "Boston, MA"
  npm run weather -- --latitude 42.3601 --longitude -71.0589 [--timezone America/New_York] [--label "Boston"]

Options:
  --city <place>       Look up a city with Open-Meteo geocoding.
  --latitude <number>  Latitude, used together with --longitude.
  --longitude <number> Longitude, used together with --latitude.
  --timezone <IANA>    Time zone for coordinate lookups (default: auto).
  --label <name>       Display label for coordinate lookups.
  --json               Print the complete forecast as JSON.
  --help               Show this help message.`;

function fail(message) {
  console.error(`Error: ${message}`);
  console.error(usage);
  process.exitCode = 1;
}

function readArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") options.help = true;
    else if (argument === "--json") options.json = true;
    else if (["--city", "--latitude", "--longitude", "--timezone", "--label"].includes(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      options[argument.slice(2)] = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function readSavedLocation() {
  const databasePath = join(process.cwd(), ".data", "household-manager.db");
  if (!existsSync(databasePath)) throw new Error("No saved household location found. Set one in the app or pass --city or coordinates.");
  const Database = require("better-sqlite3");
  const database = new Database(databasePath, { readonly: true });
  try {
    const location = database.prepare("select label, latitude, longitude, timezone from household_location where id = 'home'").get();
    if (!location) throw new Error("No saved household location found. Set one in the app or pass --city or coordinates.");
    return location;
  } finally {
    database.close();
  }
}

async function geocode(city) {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: city, count: "1", language: "en", format: "json" })}`);
  if (!response.ok) throw new Error("City lookup is temporarily unavailable.");
  const result = await response.json();
  const place = result.results?.[0];
  if (!place) throw new Error(`No location found for \"${city}\".`);
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone ?? "auto",
    label: [place.name, place.admin1, place.country].filter(Boolean).join(", ")
  };
}

function weatherPresentation(weatherCode) {
  if (weatherCode === 0) return { label: "Clear", icon: "☀" };
  if ([1, 2].includes(weatherCode)) return { label: "Partly cloudy", icon: "⛅" };
  if (weatherCode === 3) return { label: "Overcast", icon: "☁" };
  if ([45, 48].includes(weatherCode)) return { label: "Foggy", icon: "〰" };
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return { label: "Drizzle", icon: "🌦" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { label: "Rain", icon: "🌧" };
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { label: "Snow", icon: "❄" };
  return { label: "Thunderstorms", icon: "⛈" };
}

async function getForecast(location) {
  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code",
    hourly: "temperature_2m,precipitation_probability,wind_speed_10m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: location.timezone || "auto",
    forecast_days: "1"
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
  if (!response.ok) throw new Error("Weather is temporarily unavailable.");
  return response.json();
}

function printForecast(location, forecast, asJson) {
  const current = forecast.current;
  const presentation = weatherPresentation(current.weather_code);
  if (asJson) {
    console.log(JSON.stringify({ location, current, high: forecast.daily.temperature_2m_max[0], low: forecast.daily.temperature_2m_min[0], hourly: forecast.hourly }, null, 2));
    return;
  }
  const high = forecast.daily.temperature_2m_max[0];
  const low = forecast.daily.temperature_2m_min[0];
  console.log(`${presentation.icon} ${location.label}: ${Math.round(current.temperature_2m)}°F, feels like ${Math.round(current.apparent_temperature)}°F — ${presentation.label}`);
  console.log(`Today: high ${Math.round(high)}°F · low ${Math.round(low)}°F`);
  console.log(`Observed: ${current.time} (${forecast.timezone_abbreviation ?? location.timezone})`);
}

async function main() {
  const options = readArguments(process.argv.slice(2));
  if (options.help) return console.log(usage);
  const hasCoordinates = options.latitude !== undefined || options.longitude !== undefined;
  if (options.city && hasCoordinates) throw new Error("Use either --city or coordinates, not both.");
  if (hasCoordinates && (options.latitude === undefined || options.longitude === undefined)) throw new Error("--latitude and --longitude must be supplied together.");

  let location;
  if (options.city) location = await geocode(options.city);
  else if (hasCoordinates) {
    const latitude = Number(options.latitude);
    const longitude = Number(options.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Coordinates are out of range.");
    location = { latitude, longitude, timezone: options.timezone ?? "auto", label: options.label ?? `${latitude}, ${longitude}` };
  } else location = readSavedLocation();

  printForecast(location, await getForecast(location), options.json);
}

main().catch((error) => fail(error instanceof Error ? error.message : "Weather lookup failed."));
