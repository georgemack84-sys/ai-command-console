# Synchronization Engine

Synchronization is database-backed, idempotent, inspectable, and conflict-aware.

Supported modes are `IMPORT_ONLY`, `EXPORT_ONLY`, and `BIDIRECTIONAL`, depending on provider capability. Imports store external metadata in `external_records` and preserve linkage in `external_links`. Full local mutations remain behind review or Action Gateway flows.

When a remote checksum differs from a known external link, synchronization opens a conflict instead of overwriting local state. Conflicts support `LOCAL`, `REMOTE`, `MERGE`, and `CANCEL` resolutions.

Connector failures are isolated. A failed provider sync marks that connector unhealthy without corrupting local records or disabling the rest of the application.
