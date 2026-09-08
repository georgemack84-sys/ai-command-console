"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createLocationService } from "../lib/location/location-service";
import type { DeviceLocation, HouseholdLocation, LocationDraft, LocationMode } from "../lib/location/types";
import { WeatherService, weatherPresentation, type WeatherForecast } from "../lib/weather/weather-service";
import { createTaskService, type HouseholdTask, type TaskPriority } from "../lib/tasks/task-service";
import { evaluateTaskWeather } from "../lib/tasks/weather-context-engine";

const locationService = createLocationService();
const weatherService = new WeatherService();
const taskService = createTaskService();

const initialDraft: LocationDraft = {
  label: "Home",
  city: "",
  state: "",
  postalCode: "",
  country: "United States"
};

export default function HomePage() {
  const [householdLocation, setHouseholdLocation] = useState<HouseholdLocation | null>(null);
  const [draft, setDraft] = useState<LocationDraft>(initialDraft);
  const [weatherMode, setWeatherMode] = useState<LocationMode>("HOUSEHOLD");
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [message, setMessage] = useState("Set your household location to unlock local weather and outdoor task context.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    locationService.getHouseholdLocation().then((location) => {
      if (!location) return;
      setHouseholdLocation(location);
      setDraft(location);
      setMessage("Household location is ready for weather and task services.");
    });
    taskService.list().then(setTasks);
  }, []);

  const locationSummary = useMemo(() => {
    if (!householdLocation) return "Not set";
    return [householdLocation.city, householdLocation.state, householdLocation.postalCode].filter(Boolean).join(", ");
  }, [householdLocation]);

  async function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("Finding your location…");
    try {
      const saved = await locationService.saveHouseholdLocation(draft);
      setHouseholdLocation(saved);
      window.dispatchEvent(new Event("household-location-changed"));
      setMessage(`${saved.label} is saved. Coordinates and timezone are cached for weather requests.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save this location.");
    } finally {
      setSaving(false);
    }
  }

  async function testDeviceLocation() {
    setMessage("Requesting device location…");
    try {
      const current = await locationService.getCurrentDeviceLocation();
      setDeviceLocation(current);
      setMessage(`Device location received with ±${Math.round(current.accuracy)}m accuracy. It is not stored.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read the device location.");
    }
  }

  async function loadForecast() {
    setForecastLoading(true);
    setMessage("Updating local weather…");
    try {
      const location = await locationService.getEffectiveLocation(weatherMode);
      const updatedForecast = await weatherService.getForecast(location);
      setForecast(updatedForecast);
      setMessage(`Weather updated for ${updatedForecast.locationLabel}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load weather.");
    } finally {
      setForecastLoading(false);
    }
  }

  async function addOutdoorTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const task = await taskService.create(newTask, { dueDate: taskDueDate || null, priority: taskPriority });
      setTasks((current) => [...current, task]);
      setNewTask(""); setTaskDueDate(""); setTaskPriority("MEDIUM");
      setMessage(`${task.title} will use weather context when a forecast is loaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add task.");
    }
  }

  async function toggleTask(id: string) {
    setTasks(await taskService.toggle(id));
  }

  return (
    <main>
      <section className="hero">
        <nav className="top-nav"><Link className="brand" href="/">Household Manager</Link><span><Link href="/today">Today</Link><Link href="/household">Chores &amp; shopping</Link></span></nav>
        <p className="eyebrow">Household Manager</p>
        <h1>Location that serves the household.</h1>
        <p className="lede">Home remains the default. Current device location is optional, temporary, and never used to create a location history.</p>
      </section>

      <section className="grid" aria-label="Location settings">
        <article className="card primary-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Household location</p>
              <h2>{householdLocation?.label ?? "Set up home"}</h2>
            </div>
            <span className={householdLocation ? "badge ready" : "badge"}>{householdLocation ? "Ready" : "Needed"}</span>
          </div>
          <p className="location-summary">{locationSummary}</p>
          {householdLocation && <p className="meta">{householdLocation.timezone} · {householdLocation.latitude.toFixed(4)}, {householdLocation.longitude.toFixed(4)}</p>}

          <form onSubmit={saveLocation} className="location-form">
            <div className="field-row">
              <label>Label<input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} required /></label>
              <label>Postal code<input value={draft.postalCode} onChange={(event) => setDraft({ ...draft, postalCode: event.target.value })} /></label>
            </div>
            <div className="field-row">
              <label>City<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} required /></label>
              <label>State / region<input value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} required /></label>
            </div>
            <label>Country<input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} required /></label>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : householdLocation ? "Update household location" : "Save household location"}</button>
          </form>
        </article>

        <aside className="side-stack">
          <article className="card">
            <p className="eyebrow">Weather location</p>
            <h2>Choose the context</h2>
            <label className="radio"><input type="radio" name="mode" checked={weatherMode === "HOUSEHOLD"} onChange={() => setWeatherMode("HOUSEHOLD")} /> Household location <span>Recommended</span></label>
            <label className="radio"><input type="radio" name="mode" checked={weatherMode === "CURRENT_DEVICE"} onChange={() => setWeatherMode("CURRENT_DEVICE")} /> Current device location</label>
            <p className="meta">Mode: {weatherMode === "HOUSEHOLD" ? "Home conditions" : "Temporary device conditions"}</p>
          </article>

          <article className="card device-card">
            <p className="eyebrow">Device location</p>
            <h2>{deviceLocation ? "Access allowed" : "Permission not requested"}</h2>
            <p className="meta">Location is only requested when you choose this action. It is never retained.</p>
            <button className="secondary" type="button" onClick={testDeviceLocation}>Test location</button>
          </article>
        </aside>
      </section>

      <p className="notice" role="status">{message}</p>
      <section className="weather-section" aria-label="Local weather">
        <div className="weather-title">
          <div>
            <p className="eyebrow">Local weather</p>
            <h2>{forecast ? `${forecast.locationLabel} · ${forecast.source === "HOUSEHOLD" ? "Home" : "Current device"}` : "Weather context"}</h2>
          </div>
          <button className="secondary" type="button" onClick={loadForecast} disabled={forecastLoading}>{forecastLoading ? "Updating…" : "Update weather"}</button>
        </div>
        {forecast ? <WeatherCard forecast={forecast} /> : <p className="weather-empty">After setting a location, load the forecast that will later power outdoor-task recommendations.</p>}
      </section>
      <section className="task-section" aria-label="Weather-aware outdoor tasks">
        <div>
          <p className="eyebrow">Weather &amp; your tasks</p>
          <h2>Outdoor work, timed around the forecast.</h2>
          <p className="meta">Outdoor tasks default to no rain, at least 45°, and wind below 20 mph.</p>
        </div>
        <form className="task-form" onSubmit={addOutdoorTask}>
          <label>Add outdoor task<input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="e.g. Mow lawn" /></label>
          <label>Due date<input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} /></label>
          <label>Priority<select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
          <button type="submit">Add task</button>
        </form>
        <div className="task-list">
          {tasks.length ? tasks.map((task) => <TaskRow key={task.id} task={task} forecast={forecast} onToggle={toggleTask} />) : <p className="empty-tasks">Add an outdoor task to receive a deterministic weather recommendation.</p>}
        </div>
      </section>
      <section className="privacy">
        <strong>Privacy by design</strong>
        <span>Household location is stored in this browser. Device coordinates are used only for the active request—no location history is created.</span>
      </section>
    </main>
  );
}

function TaskRow({ task, forecast, onToggle }: { task: HouseholdTask; forecast: WeatherForecast | null; onToggle: (id: string) => Promise<void> }) {
  const recommendation = forecast ? evaluateTaskWeather(task, forecast) : null;
  const time = recommendation?.window ? `${formatHour(recommendation.window.start)}–${formatHour(recommendation.window.end)}` : null;
  return <article className="task-row">
    <input aria-label={`Mark ${task.title} complete`} type="checkbox" checked={task.completed} onChange={() => void onToggle(task.id)} />
    <div><strong>{task.title}</strong><span>{task.completed ? "Completed" : `${task.priority} priority${task.dueDate ? ` · due ${task.dueDate}` : ""}${recommendation ? ` · ${recommendation.summary}${time ? ` ${time}` : ""}` : ""}`}</span></div>
    {!task.completed && recommendation?.status === "GOOD_WINDOW" && <b className="good-window">Good window</b>}
  </article>;
}

function formatHour(time: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(time));
}

function WeatherCard({ forecast }: { forecast: WeatherForecast }) {
  const now = weatherPresentation(forecast.weatherCode);
  const rainNote = forecast.precipitationProbability >= 50 ? `Rain likelihood is ${forecast.precipitationProbability}% right now.` : "No significant rain is expected right now.";
  return (
    <div className="weather-card">
      <div className="weather-now">
        <span className="weather-icon" aria-hidden>{now.icon}</span>
        <div><strong>{Math.round(forecast.temperature)}°</strong><span>{now.label}</span></div>
        <p>Feels like {Math.round(forecast.apparentTemperature)}°<br />High {Math.round(forecast.high)}° · Low {Math.round(forecast.low)}°</p>
      </div>
      <p className="weather-note">{rainNote}</p>
      <div className="hourly" aria-label="Hourly forecast">
        {forecast.hourly.map((hour) => {
          const condition = weatherPresentation(hour.weatherCode);
          return <div key={hour.time}><span>{new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(hour.time))}</span><b>{condition.icon}</b><strong>{Math.round(hour.temperature)}°</strong></div>;
        })}
      </div>
    </div>
  );
}
