# AI Gateway Recovery

If assistant responses fail, inspect provider health, user AI settings, prompt versions, and recent `ai_usage` rows.

Recommended recovery order:

1. Switch the provider to `mock`.
2. Verify `/api/v1/assistant/provider-health`.
3. Confirm the active prompt version exists.
4. Retry the conversation.
5. Check audit and activity events for rejected or failed responses.

Mock provider failures should be treated as application defects because it has no network dependency.
