# Recurrence Repair

If a recurring event expands incorrectly, inspect the source event, `event_recurrence_rules`, and `event_recurrence_exceptions` rows for the affected user.

Recommended repair order:

1. Confirm the series event has the intended `recurrence_rule_id` and `recurrence_series_id`.
2. Confirm the rule frequency, interval, timezone, and duration.
3. Remove incorrect exception rows only after recording the current database backup.
4. Re-run the API tests and inspect the affected calendar window.

Do not manually insert generated occurrence rows; occurrences are expanded at read time.
