# Planning Recovery

If planning output seems incomplete, inspect the request log, context package, execution plan, tool registry, and planning metrics for the request.

Recommended recovery order:

1. Confirm the request was classified with the expected intent.
2. Confirm selected tools are enabled and read-only.
3. Inspect the context package for missing or irrelevant records.
4. Review planning metrics for context size and selected tools.
5. Re-run with a more specific request if the intent is unknown.

Because Phase 7 is non-destructive, failed planning attempts do not modify application records.
