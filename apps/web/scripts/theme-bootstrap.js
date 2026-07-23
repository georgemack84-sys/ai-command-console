/* This browser-only file deliberately has no React or application-store dependency. */
(() => {
  try {
    const key = 'proprium.theme.preference';
    const stored = window.localStorage.getItem(key);
    const preference =
      stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system';
    const system =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    const resolved = preference === 'system' ? system : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
