import type { ResolvedTheme } from './contracts';

const QUERY = '(prefers-color-scheme: dark)';

export function getSystemTheme(
  windowRef: Window | undefined = typeof window === 'undefined'
    ? undefined
    : window,
): ResolvedTheme {
  try {
    return windowRef?.matchMedia?.(QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function observeSystemTheme(
  callback: (theme: ResolvedTheme) => void,
  windowRef: Window = window,
): () => void {
  const media = windowRef.matchMedia?.(QUERY);
  if (!media) return () => undefined;
  const listener = (event: MediaQueryListEvent) =>
    callback(event.matches ? 'dark' : 'light');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
