export async function register() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  const sentryModulePath = "./server/observability/sentry";
  const { initSentry } = await import(sentryModulePath);
  initSentry();
}
