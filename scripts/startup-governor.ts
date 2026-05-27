import "dotenv/config";

import { assertRuntimeStartupAllowed } from "@/services/startup/startupGovernor";

void assertRuntimeStartupAllowed().catch((error) => {
  const code = (error as any)?.code || "STARTUP_ABORTED";
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({
    ok: false,
    code,
    message,
  }));
  process.exit(1);
});
