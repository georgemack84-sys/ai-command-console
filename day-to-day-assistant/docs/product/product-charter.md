# Product Charter

## Identity

Product name: Day-to-Day Assistant
Repository name: day-to-day-assistant
Application category: Standalone personal assistant application
Target user: One individual managing everyday responsibilities on a personal computer
Initial deployment: Local web application with a local API
Starting version: 0.0.0

## Mission

The Day-to-Day Assistant helps one user understand, organize, prepare, and manage everyday responsibilities through a private, approval-based conversational application.

## Problem

The application reduces fragmented information, missed tasks, unclear priorities, schedule conflicts, forgotten follow-ups, scattered notes, repeated planning overhead, and excessive context switching.

## Value Proposition

The assistant provides one place to review the day, a conversational planning surface, recommendations grounded in local records, explicit approvals before material actions, inspectable memory, local data ownership, portable deployment, and resilience when external services are unavailable.

## Goals

1. Provide a reliable Today view.
2. Produce grounded daily briefings.
3. Support local tasks and reminders.
4. Support a local calendar.
5. Track follow-ups.
6. Provide conversational planning.
7. Prepare drafts and proposed changes.
8. Require approval for material actions.
9. Maintain user-controlled memory.
10. Support backup and restoration on another computer.

## Non-Goals

Enterprise collaboration, multi-tenant operation, unrestricted autonomous action, autonomous purchases, financial transactions, medical diagnosis, legal decision-making, continuous surveillance, public social networking, unrestricted email sending, voice-first operation, immediate native mobile implementation, microservices, Kubernetes, self-modifying code, autonomous permission expansion, and dependency on any separate user ecosystem are excluded.

Future platform clients may be designed from the canonical Desktop Web experience under the cross-platform design architecture. That design direction does not change the standalone, single-user product boundary.

## MVP Summary

The MVP includes local authentication, application shell, tasks, reminders, local calendar, follow-ups, notes, Today view, conversations, one AI provider abstraction, deterministic mock AI provider, daily briefing, daily planning, action proposals, confirmations, activity history, memory controls, backup, and restore.

## Success Measures

Measures include successful daily briefing generation, source-linked recommendations, task and calendar operation success rates, approval bypass count, reminder reliability, backup verification, restore verification, user corrections, accepted recommendations, and time required to identify today priorities. Metrics must not reward engagement maximization or notification volume.

## Approval Record

Phase D2D.0 is conditionally accepted for repository foundation work. Final approval requires the phase qualification checklist to be completed.
