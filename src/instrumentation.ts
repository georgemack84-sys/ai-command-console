/**
 * Instrumentation must remain runtime-neutral: Next compiles it for Edge as
 * well as Node. Runtime-specific startup work is loaded only inside register.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeRuntime } = await import("./instrumentation-node");
    registerNodeRuntime();
  }
}
