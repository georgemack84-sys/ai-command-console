# ADR-0006: Version public contracts with routes

**Status:** Accepted  
**Date:** 2026-07-22

`/api/v1` maps exclusively to `Proprium.Contracts.V1`. Contracts are immutable within a version. A breaking public change requires both a new route version and a matching contract namespace, such as `/api/v2` and `Proprium.Contracts.V2`.
