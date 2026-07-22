"use client";

import Link from "next/link";
import { categoryLabels } from "@/lib/news/categories";
import { useHeadlineSettings } from "@/hooks/useHeadlineSettings";
import { useSavedStories } from "@/hooks/useSavedStories";
import { headlineCategories } from "@/types/headline";

export function SettingsClient() {
  const { settings, setSettings, resetSettings } = useHeadlineSettings();
  const { restoreHidden } = useSavedStories();

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-100">Headline Flow</p>
            <h1 className="mt-2 font-display text-4xl font-black">Settings</h1>
          </div>
          <Link href="/" className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-bold">
            Back to slideshow
          </Link>
        </div>

        <section className="mt-8 grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
          <label className="grid gap-2">
            <span className="font-semibold">Slide duration: {settings.slideDurationSeconds}s</span>
            <input
              type="range"
              min={5}
              max={60}
              value={settings.slideDurationSeconds}
              onChange={(event) => setSettings((current) => ({ ...current, slideDurationSeconds: Number(event.target.value) }))}
            />
          </label>

          <label className="grid gap-2">
            <span className="font-semibold">Default category</span>
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              value={settings.defaultCategory}
              onChange={(event) => setSettings((current) => ({ ...current, defaultCategory: event.target.value }))}
            >
              {headlineCategories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="font-semibold">Preferred text size</span>
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              value={settings.textScale}
              onChange={(event) => setSettings((current) => ({ ...current, textScale: event.target.value as typeof settings.textScale }))}
            >
              <option value="standard">Standard</option>
              <option value="large">Large</option>
              <option value="television">Television</option>
            </select>
          </label>

          <Toggle label="Auto-play enabled" checked={settings.autoplay} onChange={(value) => setSettings((current) => ({ ...current, autoplay: value }))} />
          <Toggle label="Show summaries" checked={settings.showSummaries} onChange={(value) => setSettings((current) => ({ ...current, showSummaries: value }))} />
          <Toggle label="Show timestamps" checked={settings.showTimestamps} onChange={(value) => setSettings((current) => ({ ...current, showTimestamps: value }))} />
          <Toggle label="Show image credits" checked={settings.showImageCredits} onChange={(value) => setSettings((current) => ({ ...current, showImageCredits: value }))} />
          <Toggle label="Reduced motion" checked={settings.reducedMotion} onChange={(value) => setSettings((current) => ({ ...current, reducedMotion: value }))} />

          <label className="grid gap-2">
            <span className="font-semibold">Blocked sources</span>
            <textarea
              className="min-h-24 rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              value={settings.blockedSources.join("\n")}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  blockedSources: event.target.value.split("\n").map((source) => source.trim()).filter(Boolean),
                }))
              }
            />
          </label>

          <div>
            <p className="font-semibold">Hidden categories</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {headlineCategories.map((category) => {
                const hidden = settings.hiddenCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        hiddenCategories: hidden
                          ? current.hiddenCategories.filter((item) => item !== category)
                          : [...current.hiddenCategories, category],
                      }))
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${hidden ? "border-amber-200 bg-amber-200 text-slate-950" : "border-white/10 bg-white/6"}`}
                  >
                    {categoryLabels[category]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={restoreHidden} className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-bold">
              Restore hidden stories
            </button>
            <button type="button" onClick={resetSettings} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
              Reset settings
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="font-semibold">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5" />
    </label>
  );
}
