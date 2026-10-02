# Nuru V1 Final Architecture

```text
User → Nuru Dashboard → Nuru API → Nuru Curator
                                      │
             ┌────────────────────────┼────────────────────────┐
             ▼                        ▼                        ▼
         Discovery                  Context                 Connection
             └────────────────────────┼────────────────────────┘
                                      ▼
                                   Quality
                                      ▼
                              Curation Proposal
                                      ▼
                                  Governance
                           ┌──────────┴──────────┐
                           ▼                     ▼
                      Human Review         Approved Route
                           └──────────┬──────────┘
                                      ▼
                                Service Layer
        Archive · Search · Metadata · Audit · Permissions · Embeddings
                                      ▼
                            Database / Vector Index
```

Agents reason and propose. Governance authorizes. Services store, retrieve,
validate, enforce, index, audit, and execute deterministic work. The API is the
dashboard boundary; agents use controlled internal runtime tools and never receive
direct database, filesystem, credential, or permission-store access.

Every meaningful curation action carries provenance, audit data, version snapshots,
bounded budgets, replay input, and human-review evidence where required.
