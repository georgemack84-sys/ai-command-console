"use client";

import { useEffect, useMemo, useState } from "react";
import { getTemporalState } from "@/core/clock-engine";
import type { TemporalState } from "@/core/temporal-state";
import { recordAudit } from "@/services/audit-log";
import {
  cancelNativeAlarm,
  scheduleNativeAlarm,
  type NativeAlarmScheduleStatus,
} from "@/services/native-local-notifications";
import {
  loadPersisted,
  savePersisted,
  validateAlarms,
  validateStopwatch,
  validateTimers,
} from "@/services/persistence";
import {
  advanceTimers,
  horizonEvents,
  nextAlarmOccurrence,
  remainingTimerMs,
  type Alarm,
  type AlarmRecurrence,
  type Stopwatch,
  type Timer,
} from "@/services/time-tools";

const alarmsKey = "axiom-time:alarms";
const timersKey = "axiom-time:timers";
const stopwatchKey = "axiom-time:stopwatch";

const createId = () => crypto.randomUUID();

const pausedStopwatch: Stopwatch = {
  startedAt: null,
  elapsedMs: 0,
  running: false,
};

export function useTimeWorkspace() {
  const [now, setNow] = useState(() => Date.now());
  const [temporalState, setTemporalState] = useState<TemporalState | null>(
    null,
  );
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [stopwatch, setStopwatch] = useState<Stopwatch>(pausedStopwatch);
  const [nativeAlarmStatus, setNativeAlarmStatus] =
    useState<NativeAlarmScheduleStatus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      setAlarms(loadPersisted(alarmsKey, [], validateAlarms));
      setTimers(loadPersisted(timersKey, [], validateTimers));
      setStopwatch(
        loadPersisted(stopwatchKey, pausedStopwatch, validateStopwatch),
      );
      setReady(true);
    }, 0);
    const tick = () => {
      const timestamp = Date.now();
      setNow(timestamp);
      setTemporalState(getTemporalState());
      setTimers((current) => advanceTimers(current, timestamp));
    };
    tick();
    const interval = window.setInterval(tick, 1_000);
    return () => {
      window.clearTimeout(restore);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (ready) savePersisted(alarmsKey, alarms);
  }, [alarms, ready]);
  useEffect(() => {
    if (ready) savePersisted(timersKey, timers);
  }, [ready, timers]);
  useEffect(() => {
    if (ready) savePersisted(stopwatchKey, stopwatch);
  }, [ready, stopwatch]);

  const addAlarm = (
    time: string,
    label: string,
    recurrence: AlarmRecurrence,
  ) => {
    const [hour, minute] = time.split(":").map(Number);
    const alarm: Alarm = {
      id: createId(),
      label: label.trim() || "Alarm",
      hour,
      minute,
      recurrence,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    setAlarms((current) => [...current, alarm]);
    recordAudit("alarm.created", alarm.id);
    void scheduleNativeAlarm(alarm, nextAlarmOccurrence(alarm)).then(
      (status) => {
        setNativeAlarmStatus(status);
        recordAudit(`alarm.native.${status}`, alarm.id);
      },
    );
  };

  const toggleAlarm = (id: string) => {
    const current = alarms.find((alarm) => alarm.id === id);
    if (!current) return;
    const next = { ...current, enabled: !current.enabled };
    setAlarms((items) =>
      items.map((alarm) => (alarm.id === id ? next : alarm)),
    );
    recordAudit(next.enabled ? "alarm.enabled" : "alarm.disabled", id);
    if (next.enabled)
      void scheduleNativeAlarm(next, nextAlarmOccurrence(next)).then(
        (status) => {
          setNativeAlarmStatus(status);
          recordAudit(`alarm.native.${status}`, next.id);
        },
      );
    else void cancelNativeAlarm(id);
  };
  const removeAlarm = (id: string) => {
    setAlarms((current) => current.filter((alarm) => alarm.id !== id));
    recordAudit("alarm.deleted", id);
    void cancelNativeAlarm(id);
  };

  const addTimer = (minutes: number, label: string) => {
    const safeMinutes = Math.min(10_080, Math.floor(minutes));
    if (!Number.isFinite(safeMinutes) || safeMinutes < 1) return;
    const timer: Timer = {
      id: createId(),
      label: label.trim() || "Timer",
      durationMs: safeMinutes * 60_000,
      remainingMs: safeMinutes * 60_000,
      startedAt: Date.now(),
      status: "running",
      createdAt: new Date().toISOString(),
    };
    setTimers((current) => [...current, timer]);
    recordAudit("timer.created", timer.id);
  };

  const toggleTimer = (id: string) =>
    setTimers((current) =>
      current.map((timer) => {
        if (timer.id !== id || timer.status === "complete") return timer;
        if (timer.status === "running")
          return {
            ...timer,
            remainingMs: remainingTimerMs(timer),
            startedAt: null,
            status: "paused",
          };
        return { ...timer, startedAt: Date.now(), status: "running" };
      }),
    );
  const removeTimer = (id: string) => {
    setTimers((current) => current.filter((timer) => timer.id !== id));
    recordAudit("timer.deleted", id);
  };

  const stopwatchElapsed =
    stopwatch.running && stopwatch.startedAt !== null
      ? stopwatch.elapsedMs + (now - stopwatch.startedAt)
      : stopwatch.elapsedMs;
  const toggleStopwatch = () =>
    setStopwatch((current) =>
      current.running
        ? {
            ...current,
            elapsedMs:
              current.elapsedMs +
              (Date.now() - (current.startedAt ?? Date.now())),
            startedAt: null,
            running: false,
          }
        : { ...current, startedAt: Date.now(), running: true },
    );
  const resetStopwatch = () => setStopwatch(pausedStopwatch);

  return {
    temporalState,
    alarms,
    timers,
    stopwatchElapsed,
    stopwatchRunning: stopwatch.running,
    nativeAlarmStatus,
    horizon: useMemo(
      () => horizonEvents(alarms, timers, now),
      [alarms, timers, now],
    ),
    addAlarm,
    toggleAlarm,
    removeAlarm,
    addTimer,
    toggleTimer,
    removeTimer,
    toggleStopwatch,
    resetStopwatch,
  };
}
