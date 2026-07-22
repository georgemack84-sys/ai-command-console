# Calendar Event Lifecycle

Local calendar events are owned by the signed-in local user and belong to a local calendar. Timed events require `start_at` and `end_at` values with `end_at` after `start_at`. All-day events use `start_date` and exclusive `end_date` semantics.

Supported event states are `CONFIRMED`, `TENTATIVE`, `CANCELLED`, and `ARCHIVED`. Events can be created, updated, moved, copied, confirmed, marked tentative, cancelled, restored, archived, and delete-requested. Delete requests currently archive the event to preserve local history and audit records.

Events may include location, description, type, visibility, availability status, preparation items, task links, follow-up links, and reminder offsets. Calendar actions and event actions record local activity and audit events.
