export function toIsoDate(value: string | Date | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function relativeTime(value: string) {
  const then = new Date(value).getTime();
  const diffSeconds = Math.max(1, Math.round((Date.now() - then) / 1000));
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (diffSeconds >= seconds) return formatter.format(-Math.round(diffSeconds / seconds), unit);
  }
  return "just now";
}
