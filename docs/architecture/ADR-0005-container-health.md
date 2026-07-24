# ADR-0005: Docker Compose owns development health evaluation

**Status:** Accepted  
**Date:** 2026-07-22

Docker Compose evaluates development liveness through `GET /api/v1/health/live`. The production Dockerfile contains no `HEALTHCHECK` and does not install `curl` or `wget` solely for probing. A portable image-level probe may be added only after qualification.
