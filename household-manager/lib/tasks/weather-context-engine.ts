import type { HourlyForecast, WeatherForecast } from "../weather/weather-service";
import type { HouseholdTask } from "./task-service";

export type TaskWeatherRecommendation = {
  status: "GOOD_WINDOW" | "UNSUITABLE" | "NOT_APPLICABLE";
  summary: string;
  window?: { start: string; end: string };
};

function isSuitable(hour: HourlyForecast, task: HouseholdTask): boolean {
  return hour.temperature >= task.minimumTemperatureF
    && hour.windSpeed <= task.maximumWindMph
    && hour.precipitationProbability < 70;
}

export function evaluateTaskWeather(task: HouseholdTask, forecast: WeatherForecast): TaskWeatherRecommendation {
  if (task.completed || task.environment !== "OUTDOOR" || !task.weatherSensitive) {
    return { status: "NOT_APPLICABLE", summary: task.completed ? "Completed" : "No weather guidance needed." };
  }
  const suitableHours = forecast.hourly.filter((hour) => isSuitable(hour, task));
  if (!suitableHours.length) {
    return { status: "UNSUITABLE", summary: "No suitable outdoor window in the current forecast." };
  }
  const first = suitableHours[0];
  let last = first;
  const firstIndex = forecast.hourly.findIndex((hour) => hour.time === first.time);
  for (const hour of forecast.hourly.slice(firstIndex + 1)) {
    if (isSuitable(hour, task)) last = hour;
    else break;
  }
  return { status: "GOOD_WINDOW", summary: "Good weather window", window: { start: first.time, end: last.time } };
}
