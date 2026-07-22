# Prompt Registry

Prompts are versioned application assets stored in `prompts` and `prompt_versions`. Phase 6 seeds the `conversation.advisory` prompt with an immutable active version.

Every assistant response stores the active prompt version. Prompt content is inspectable through the API and web settings page.

Future prompt edits should create new versions rather than mutating existing prompt-version rows.
