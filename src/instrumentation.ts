import { initSentry } from "@/src/server/observability/sentry";

export function register() {
  initSentry();
}
