# ADR-0002: Build frontend public configuration per environment

**Status:** Accepted  
**Date:** 2026-07-22

## Decision

The frontend uses a build-per-environment strategy. `NEXT_PUBLIC_*` values are supplied as Docker build arguments and embedded during `next build`. A deployment environment therefore receives its own frontend image.

## Consequences

Restarting a container cannot change browser-visible configuration; changing public configuration requires rebuilding the image. This makes the served client deterministic and prevents a runtime configuration mechanism from implying flexibility that Next.js cannot provide for browser bundles.

## Benefits and trade-offs

The approach gives reproducible client configuration and clear deployment provenance. It trades away runtime reuse of one image across environments and increases the number of images to manage.

## Revisit triggers

Revisit this decision if a separately versioned, authenticated runtime configuration service becomes necessary, or if deployment requirements make per-environment images operationally unacceptable.
