"use client";

import { useCallback, useEffect, useState } from "react";

type NarrationState = {
  supported: boolean;
  enabled: boolean;
  speaking: boolean;
  paused: boolean;
  toggleEnabled: () => void;
  stop: () => void;
};

export function useHeadlineNarration({
  storyId,
  script,
  playing,
}: {
  storyId: string;
  script: string;
  playing: boolean;
}): NarrationState {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [supported]);

  const speak = useCallback(() => {
    if (!supported || !script.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onpause = () => setPaused(true);
    utterance.onresume = () => setPaused(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    const voice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.lang.toLowerCase().startsWith("en") && /natural|premium|enhanced|online/i.test(candidate.name));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [script, supported]);

  const toggleEnabled = useCallback(() => {
    if (!supported) return;
    setEnabled((current) => {
      const next = !current;
      if (!next) window.speechSynthesis.cancel();
      return next;
    });
  }, [supported]);

  useEffect(() => {
    if (!supported || !enabled) return;
    if (!playing) {
      window.speechSynthesis.pause();
      return;
    }
    if (paused) {
      window.speechSynthesis.resume();
    }
  }, [enabled, paused, playing, supported]);

  useEffect(() => {
    if (!supported || !enabled || !playing) return;
    speak();
  }, [enabled, playing, speak, storyId, supported]);

  useEffect(() => stop, [stop]);

  return {
    supported,
    enabled,
    speaking,
    paused,
    toggleEnabled,
    stop,
  };
}
