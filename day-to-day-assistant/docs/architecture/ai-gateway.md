# AI Gateway

The AI Gateway is the only application-owned interface for model interaction. Phase 6 implements a deterministic mock provider and adapter shells for hosted and local providers.

The gateway supports text generation, structured advisory responses, stream chunk simulation, provider health checks, token estimation, usage logging, prompt-version recording, and provider settings. Model output is treated as untrusted input and validated before persistence.

Phase 6 is advisory-only: gateway responses cannot create or modify tasks, reminders, notes, calendars, settings, files, memory, or any other application state.
