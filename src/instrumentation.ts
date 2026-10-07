/**
 * Instrumentation must remain runtime-neutral: Next compiles it for Edge as
 * well as Node. Server error capture initializes Sentry lazily through
 * `captureException`, so importing the Node-only SDK here is unnecessary.
 */
export function register() {}
