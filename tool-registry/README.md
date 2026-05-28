# Canonical Tool Registry

This directory is the authoritative registry for executable tools.

Rules:
- every executable tool must be declared in `registry.json`
- every tool must reference input schema, output schema, policy, and adapter artifacts
- registry validation fails closed on drift, overrides, or missing governance metadata
