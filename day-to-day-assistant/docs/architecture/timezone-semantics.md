# Timezone Semantics

Calendar records store a timezone string and validate it with the Python standard library `zoneinfo` database. Timed event timestamps are normalized through ISO datetimes and treated as timezone-aware values, defaulting to UTC when no timezone is supplied.

All-day events are stored as local dates with exclusive end dates. They are not converted to UTC instants.

Conditional limitation: recurring timed events currently advance from stored datetimes rather than re-materializing each occurrence through local timezone wall-clock rules.
