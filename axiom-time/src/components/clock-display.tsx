"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { ProposedTimeAction } from "@/contracts/time-intents";
import { sceneClassForMutation } from "@/core/time-mutation";
import { useTimeWorkspace } from "@/hooks/use-time-workspace";
import { startBrowserVoice } from "@/services/browser-voice";
import {
  enableNotifications,
  type NotificationEnablement,
} from "@/services/notification-adapter";
import { parseTimeCommand } from "@/services/time-command-parser";
import { formatDuration, nextAlarmOccurrence } from "@/services/time-tools";
import {
  fetchWeatherContext,
  loadCachedWeather,
  saveCachedWeather,
  type WeatherContext,
} from "@/services/weather-adapter";

const formatAlarm = (hour: number, minute: number) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2026, 0, 1, hour, minute));

const hours = Array.from({ length: 24 }, (_, hour) => hour);
const minutes = Array.from({ length: 60 }, (_, minute) => minute);

export function ClockDisplay() {
  const workspace = useTimeWorkspace();
  const [alarmLabel, setAlarmLabel] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("25");
  const [timerLabel, setTimerLabel] = useState("");
  const [command, setCommand] = useState("");
  const [proposal, setProposal] = useState<ProposedTimeAction | null>(null);
  const [commandError, setCommandError] = useState("");
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [weatherFetchedAt, setWeatherFetchedAt] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [weatherStatus, setWeatherStatus] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherCity, setWeatherCity] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationEnablement | null>(null);

  if (!workspace.temporalState) {
    return <p className="clock-loading">Calibrating local time…</p>;
  }

  const { temporalState } = workspace;
  const [time, meridiem] = temporalState.localTime.split(" ");
  const nextEvent = workspace.horizon[0];

  const submitAlarm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    workspace.addAlarm(
      `${String(form.get("alarm-hour")).padStart(2, "0")}:${String(form.get("alarm-minute")).padStart(2, "0")}`,
      String(form.get("alarm-label")),
      "daily",
    );
    setAlarmLabel("");
  };

  const submitTimer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const minutes = Number(form.get("timer-minutes"));
    if (Number.isFinite(minutes) && minutes > 0) {
      workspace.addTimer(minutes, String(form.get("timer-label")));
    }
    setTimerLabel("");
  };

  const proposeCommand = (
    value: string,
    source: ProposedTimeAction["source"] = "text",
  ) => {
    const intent = parseTimeCommand(value);
    if (!intent) {
      setCommandError(
        "Try: “set an alarm for 7:30 PM”, “start a 25 minute timer”, or “weather in Brooklyn”.",
      );
      return;
    }
    setCommandError("");
    setProposal({
      id: crypto.randomUUID(),
      intent,
      source,
      createdAt: new Date().toISOString(),
      status: "PENDING",
    });
  };

  const submitCommand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    proposeCommand(command);
  };

  const startVoice = () => {
    setVoiceStatus("");
    const supported = startBrowserVoice(
      (transcript) => {
        setCommand(transcript);
        proposeCommand(transcript, "voice");
      },
      (message) => setVoiceStatus(`Voice recognition failed: ${message}.`),
    );
    if (!supported) {
      setVoiceStatus(
        "Voice recognition is unavailable in this browser. You can still type a command.",
      );
    }
  };

  const requestNotifications = async () =>
    setNotificationStatus(await enableNotifications());

  useEffect(() => {
    const cached = loadCachedWeather();
    if (!cached) return;
    setWeather(cached.weather);
    setWeatherFetchedAt(cached.fetchedAt);
    setWeatherCity(cached.weather.city);
  }, []);

  const loadWeather = async (city: string) => {
    setWeatherCity(city);
    setWeatherLoading(true);
    setWeatherError("");
    setWeatherStatus(
      "Waking the weather service. The free service can take up to a minute on its first request.",
    );
    try {
      const nextWeather = await fetchWeatherContext({
        adapterUrl: process.env.NEXT_PUBLIC_AXIOM_ADAPTERS_URL,
        city,
        onRetry: (attempt) =>
          setWeatherStatus(
            `Still connecting to weather service (attempt ${attempt} of 3)…`,
          ),
      });
      setWeather(nextWeather);
      saveCachedWeather(nextWeather);
      setWeatherFetchedAt(new Date().toISOString());
      setWeatherStatus("");
    } catch (error) {
      setWeatherError(
        error instanceof Error ? error.message : "Weather lookup failed.",
      );
      setWeatherStatus("");
    } finally {
      setWeatherLoading(false);
    }
  };

  const confirmProposal = async () => {
    if (!proposal) return;
    const { intent } = proposal;
    if (intent.type === "CREATE_ALARM") {
      workspace.addAlarm(intent.time, intent.label, "daily");
    } else if (intent.type === "START_TIMER") {
      workspace.addTimer(intent.minutes, intent.label);
    } else {
      await loadWeather(intent.city);
    }
    setProposal(null);
    setCommand("");
  };

  return (
    <div
      className={`time-workspace ${sceneClassForMutation(temporalState.dayPeriod)}`}
    >
      <section
        className="clock"
        aria-live="polite"
        aria-label={`Local time ${temporalState.localTime}`}
      >
        <p className="eyebrow">Axiom Time</p>
        <div className="time" aria-label={temporalState.localTime}>
          <span>{time}</span>
          <small>{meridiem}</small>
        </div>
        <p className="date">{temporalState.date}</p>
        <div className="horizon horizon-line" aria-label="Time horizon">
          <span />
          <i />
          <span />
        </div>
        <p className="horizon-label">Time horizon</p>
        <p className="timezone">
          {temporalState.timezone.replace("_", " ")} ·{" "}
          {temporalState.dayPeriod.replace("_", " ")}
        </p>
      </section>

      <section className="utility-grid" aria-label="Time tools">
        <article className="time-card horizon-card">
          <p className="card-label">Up next</p>
          {nextEvent ? (
            <>
              <strong>{nextEvent.label}</strong>
              <span>
                {new Date(nextEvent.occursAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {nextEvent.kind}
              </span>
            </>
          ) : (
            <span>Nothing scheduled in your horizon.</span>
          )}
        </article>

        <article className="time-card">
          <div className="card-heading">
            <p className="card-label">Alarms</p>
            <span>
              {workspace.alarms.filter((alarm) => alarm.enabled).length} active
            </span>
          </div>
          <form className="tool-form" onSubmit={submitAlarm}>
            <div className="alarm-time-fields" aria-label="Alarm time">
              <select
                aria-label="Alarm hour"
                name="alarm-hour"
                defaultValue="7"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                aria-label="Alarm minute"
                name="alarm-minute"
                defaultValue="0"
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {String(minute).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <input
              aria-label="Alarm label"
              name="alarm-label"
              value={alarmLabel}
              onChange={(event) => setAlarmLabel(event.target.value)}
              placeholder="Label"
              maxLength={40}
            />
            <button type="submit">Add</button>
          </form>
          {workspace.nativeAlarmStatus &&
            workspace.nativeAlarmStatus !== "browser" && (
              <p className="helper-text" role="status">
                {workspace.nativeAlarmStatus === "scheduled"
                  ? "Native alarm scheduled."
                  : workspace.nativeAlarmStatus === "scheduled-inexact"
                    ? "Alarm scheduled, but your device may deliver it a little late."
                    : workspace.nativeAlarmStatus === "permission-denied"
                      ? "Alarm saved, but native delivery needs notification permission."
                      : "Alarm saved, but native scheduling failed. Try enabling notifications in device settings."}
              </p>
            )}
          <ul className="tool-list">
            {workspace.alarms.length === 0 ? (
              <li className="empty">No alarms yet.</li>
            ) : (
              workspace.alarms.map((alarm) => (
                <li key={alarm.id}>
                  <button
                    className="toggle"
                    type="button"
                    onClick={() => workspace.toggleAlarm(alarm.id)}
                    aria-label={`${alarm.enabled ? "Disable" : "Enable"} ${alarm.label}`}
                  >
                    {alarm.enabled ? "On" : "Off"}
                  </button>
                  <span>
                    <strong>{formatAlarm(alarm.hour, alarm.minute)}</strong>
                    <small>
                      {alarm.label} · next{" "}
                      {nextAlarmOccurrence(alarm).toLocaleDateString([], {
                        weekday: "short",
                      })}
                    </small>
                  </span>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => workspace.removeAlarm(alarm.id)}
                    aria-label={`Remove ${alarm.label}`}
                  >
                    ×
                  </button>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="time-card">
          <div className="card-heading">
            <p className="card-label">Timers</p>
            <span>
              {
                workspace.timers.filter((timer) => timer.status === "running")
                  .length
              }{" "}
              running
            </span>
          </div>
          <form className="tool-form" onSubmit={submitTimer}>
            <input
              aria-label="Timer duration in minutes"
              name="timer-minutes"
              type="number"
              min="1"
              max="720"
              value={timerMinutes}
              onChange={(event) => setTimerMinutes(event.target.value)}
              required
            />
            <input
              aria-label="Timer label"
              name="timer-label"
              value={timerLabel}
              onChange={(event) => setTimerLabel(event.target.value)}
              placeholder="Label"
              maxLength={40}
            />
            <button type="submit">Start</button>
          </form>
          <ul className="tool-list">
            {workspace.timers.length === 0 ? (
              <li className="empty">No timers yet.</li>
            ) : (
              workspace.timers.map((timer) => (
                <li key={timer.id}>
                  <button
                    className="toggle"
                    type="button"
                    disabled={timer.status === "complete"}
                    onClick={() => workspace.toggleTimer(timer.id)}
                  >
                    {timer.status === "running"
                      ? "Pause"
                      : timer.status === "paused"
                        ? "Start"
                        : "Done"}
                  </button>
                  <span>
                    <strong>{formatDuration(timer.remainingMs)}</strong>
                    <small>{timer.label}</small>
                  </span>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => workspace.removeTimer(timer.id)}
                    aria-label={`Remove ${timer.label}`}
                  >
                    ×
                  </button>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="time-card stopwatch-card">
          <p className="card-label">Stopwatch</p>
          <strong>{formatDuration(workspace.stopwatchElapsed)}</strong>
          <div>
            <button type="button" onClick={workspace.toggleStopwatch}>
              {workspace.stopwatchRunning ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={workspace.resetStopwatch}
            >
              Reset
            </button>
          </div>
        </article>

        <article className="time-card command-card">
          <p className="card-label">Axiom Assistant</p>
          <form className="command-form" onSubmit={submitCommand}>
            <input
              aria-label="Time command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Set an alarm for 7:30 PM"
              required
            />
            <button type="submit">Propose</button>
          </form>
          <button className="voice-button" type="button" onClick={startVoice}>
            Use voice
          </button>
          <p className="helper-text">
            Commands are proposals. They never modify time services without your
            confirmation.
          </p>
          {commandError && (
            <p className="form-error" role="alert">
              {commandError}
            </p>
          )}
          {voiceStatus && (
            <p className="form-error" role="status">
              {voiceStatus}
            </p>
          )}
          {proposal && (
            <div className="proposal" role="status">
              <strong>
                {proposal.intent.type === "CREATE_ALARM"
                  ? `Create ${proposal.intent.label} for ${proposal.intent.time}`
                  : proposal.intent.type === "START_TIMER"
                    ? `Start a ${proposal.intent.minutes}-minute timer`
                    : `Load weather for ${proposal.intent.city}`}
              </strong>
              <span>Requested via {proposal.source}; awaiting approval.</span>
              <div>
                <button
                  type="button"
                  onClick={confirmProposal}
                  disabled={weatherLoading}
                >
                  {weatherLoading ? "Loading…" : "Approve"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setProposal(null)}
                >
                  Deny
                </button>
              </div>
            </div>
          )}
        </article>

        <article className="time-card weather-card">
          <p className="card-label">Weather context</p>
          {weather ? (
            <>
              <strong>
                {weather.city} · {Math.round(weather.temperature)}°
              </strong>
              <span>
                Sunrise{" "}
                {new Date(weather.sunrise).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · Sunset{" "}
                {new Date(weather.sunset).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </>
          ) : (
            <span>
              Use a proposed “weather in [city]” command to load optional
              context.
            </span>
          )}
          {weatherError && (
            <div className="weather-error" role="alert">
              <p className="form-error">{weatherError}</p>
              <button
                type="button"
                onClick={() => void loadWeather(weatherCity)}
                disabled={weatherLoading || !weatherCity}
              >
                Retry weather
              </button>
            </div>
          )}
          {weatherLoading && (
            <p className="helper-text" role="status">
              {weatherStatus}
            </p>
          )}
          {weather && weatherFetchedAt && !weatherLoading && (
            <p className="helper-text" role="status">
              Saved locally{" "}
              {new Date(weatherFetchedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              .
            </p>
          )}
        </article>

        <article className="time-card notification-card">
          <p className="card-label">Notifications</p>
          <p className="helper-text">
            Optional system notifications for active Axiom Time sessions.
            Closed-app alarm delivery needs the native adapter or configured
            push service.
          </p>
          <button type="button" onClick={requestNotifications}>
            {notificationStatus === "enabled"
              ? "Notifications enabled"
              : "Enable notifications"}
          </button>
          {notificationStatus && notificationStatus !== "enabled" && (
            <p className="form-error" role="status">
              {notificationStatus === "unsupported"
                ? "Notifications are unsupported in this browser."
                : "Notification permission was not granted."}
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
