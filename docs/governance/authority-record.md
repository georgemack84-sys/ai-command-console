# Authority Record — Phase 6, Part III

- Version: 6.3
- Status: Foundational metadata contract

An `AuthorityRecord` explains a specific authority claim. It records the
canonical authority type, the source and source identity, a typed scope,
establishment and effective times, prior authority it supersedes, approval and
delegation lineage where applicable, explicit constraints, and provenance.

Authority is distinct from provenance. `authoritySource` and `sourceIdentity`
state why a source may establish information; `provenance` identifies the
observation from which that information was encountered.

The contract validates record shape only. It neither assigns a record to an
incoming statement nor decides whether one record outranks, supersedes, or
revokes another. Those are Parts IV–VII.
