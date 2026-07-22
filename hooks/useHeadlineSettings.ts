"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultHeadlineFlowSettings,
  parseStoredSettings,
  settingsStorageKey,
  type HeadlineFlowSettings,
} from "@/lib/storage/localSettings";

export function useHeadlineSettings() {
  const [settings, setSettingsState] = useState<HeadlineFlowSettings>(defaultHeadlineFlowSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSettingsState(parseStoredSettings(window.localStorage.getItem(settingsStorageKey)));
      setReady(true);
    });
  }, []);

  const setSettings = useCallback((next: HeadlineFlowSettings | ((current: HeadlineFlowSettings) => HeadlineFlowSettings)) => {
    setSettingsState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      window.localStorage.setItem(settingsStorageKey, JSON.stringify(value));
      return value;
    });
  }, []);

  const resetSettings = useCallback(() => setSettings(defaultHeadlineFlowSettings), [setSettings]);

  return { settings, setSettings, resetSettings, ready };
}
