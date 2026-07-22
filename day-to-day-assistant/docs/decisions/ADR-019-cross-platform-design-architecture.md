# ADR-019 - Cross-Platform Design Architecture

Status: Accepted
Date: 2026-07-18

## Context

Day-to-Day Assistant began with Desktop Web as the primary local interface. The product design prompt has evolved into a cross-platform product design specification that should guide future Windows, macOS, tablet, and phone clients without fragmenting the product identity.

## Decision

Use Desktop Web as the canonical design source of truth. All other clients inherit its navigation hierarchy, visual language, component library, design tokens, typography, spacing, motion, accessibility, and interaction patterns.

Platform-specific experiences are adaptations, not separate redesigns.

## Alternatives Considered

Designing each platform independently was rejected because it would create inconsistent interaction models and duplicate design system work.

## Consequences

The design system becomes a permanent cross-platform contract. Future platform clients must document their adaptations against the canonical Desktop Web design.

## Product Scope Impact

This decision updates design architecture only. It does not require immediate native mobile or desktop implementation.

## Revisit Conditions

Revisit after a native client is approved for implementation or after the web shell migrates to a full component framework.
