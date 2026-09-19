"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Alarm } from "@/services/time-tools";

export const isNativeNotificationRuntime = () => Capacitor.isNativePlatform();

export type NativeAlarmScheduleStatus =
  | "browser"
  | "scheduled"
  | "scheduled-inexact"
  | "permission-denied"
  | "failed";

const nativeIdFor = (id: string): number =>
  id
    .split("")
    .reduce(
      (value, character) =>
        (value * 31 + character.charCodeAt(0)) % 2_000_000_000,
      1,
    );

export const scheduleNativeAlarm = async (
  alarm: Alarm,
  at: Date,
): Promise<NativeAlarmScheduleStatus> => {
  if (!isNativeNotificationRuntime()) return "browser";
  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display === "prompt") {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== "granted") return "permission-denied";
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          id: nativeIdFor(alarm.id),
          title: "Axiom Time",
          body: alarm.label,
          schedule: {
            at,
            repeats: alarm.recurrence === "daily",
            allowWhileIdle: true,
          },
        },
      ],
    });
    return result.warning ? "scheduled-inexact" : "scheduled";
  } catch {
    return "failed";
  }
};

export const cancelNativeAlarm = async (alarmId: string): Promise<void> => {
  if (!isNativeNotificationRuntime()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: nativeIdFor(alarmId) }],
    });
  } catch {
    // The local record is removed even if the OS no longer knows this alarm.
  }
};
