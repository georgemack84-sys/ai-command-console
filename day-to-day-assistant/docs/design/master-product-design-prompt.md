# Master Product Design Prompt

This prompt is the canonical visual and interaction contract for Day-to-Day Assistant.

Day-to-Day Assistant is a standalone, single-user personal assistant for everyday planning, tasks, reminders, calendars, notes, conversations, memory, automations, connectors, and production operations. The design system must support a calm, work-focused product that favors clarity, trust, recoverability, and explicit user control.

## Cross-Platform Design Architecture

### Platform Strategy

This product is designed as a single product ecosystem with multiple client applications.

Do not design each platform independently. Design one unified experience that adapts appropriately to each platform while maintaining one recognizable identity.

Supported platforms:

- Desktop Web (Primary Reference Platform)
- Windows Desktop
- macOS Desktop
- iPad
- Android Tablet
- iPhone
- Android Phone

Desktop Web is the canonical design. All remaining platforms inherit from it.

### Cross-Platform Design Philosophy

The user should immediately recognize the application regardless of device. The application should always feel like the same product.

Platform conventions should be respected without sacrificing brand identity:

- macOS should feel native while remaining recognizably Day-to-Day Assistant.
- Windows should respect Fluent interaction patterns while maintaining the same visual language.
- Tablets should preserve desktop productivity.
- Phones should focus on task completion and quick interactions.

Never redesign the application from scratch for another platform. Adapt. Do not reinvent.

### Canonical Platform

The Desktop Web application is the design source of truth.

Every other client inherits:

- navigation hierarchy;
- visual language;
- component library;
- design tokens;
- typography;
- spacing;
- motion;
- accessibility;
- interaction patterns.

Platform-specific adaptations are documented as variants rather than replacements for the canonical design.

## Platform Adaptation Matrix

Every feature specification must include this matrix:

| Feature | Desktop Web | Windows | macOS | iPad | Android Tablet | iPhone | Android Phone |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Shared behavior | Canonical | Inherits canonical | Inherits canonical | Inherits canonical | Inherits canonical | Inherits canonical | Inherits canonical |
| Platform-specific behavior | Source of truth | Fluent affordances | macOS affordances | Touch and split view | Touch and multi-window | Fast task completion | Fast task completion |
| Unavailable functionality | None by default | Document exceptions | Document exceptions | Document exceptions | Document exceptions | Document exceptions | Document exceptions |
| Alternative interaction | Keyboard, mouse | Keyboard, mouse, context menus | Keyboard, trackpad, menu bar | Touch, pointer, keyboard | Touch, pointer, keyboard | Touch, voice dictation where native | Touch, voice dictation where native |
| Responsive adaptation | Persistent panels | Resizable window | Resizable window | Two-panel or drawer | Two-panel or drawer | Stacked screens | Stacked screens |

Each feature must identify shared behavior, platform-specific behavior, unavailable functionality, alternative interaction, and responsive adaptation.

## Shared Component Library

Every component must specify:

- Shared Component
- Platform Variant
- Responsive Variant
- Accessibility Variant
- Motion Variant

Examples:

- Sidebar: desktop uses persistent navigation; tablet collapses; phone becomes bottom navigation plus drawer.
- Conversation: desktop uses three panels; tablet uses two; phone uses stacked navigation.
- Calendar: desktop supports rich month, week, day, and agenda views; phone prioritizes agenda and day.

## Responsive Design Rules

Breakpoints:

| Breakpoint | Width |
| --- | --- |
| Desktop | >=1440 px |
| Laptop | 1200-1439 px |
| Tablet Landscape | 992-1199 px |
| Tablet Portrait | 768-991 px |
| Phone Landscape | 576-767 px |
| Phone Portrait | <=575 px |

For each breakpoint, define grid, navigation, spacing, typography, component resizing, panel collapse, sidebar behavior, context panel behavior, search behavior, floating actions, dialogs, tables, charts, calendar, and assistant workspace behavior.

## Navigation Adaptation

Desktop:

- Persistent left sidebar.
- Right context panel.
- Three-column layout for assistant workflows.

Tablet:

- Collapsible sidebar.
- Context drawer.
- Adaptive workspace.

Phone:

- Bottom navigation.
- Drawer navigation.
- Full-screen conversations.
- Context becomes stacked cards.

## Platform-Specific UX

For Windows, macOS, iPad, Android Tablet, iPhone, and Android Phone, each screen specification must include guidance for:

- navigation;
- menus;
- keyboard shortcuts;
- touch interactions;
- mouse interactions;
- trackpad gestures;
- window resizing;
- split-screen behavior;
- notifications;
- file handling;
- drag and drop;
- clipboard behavior;
- context menus.

## Offline Strategy

Design the application to operate offline whenever possible.

Document offline capabilities, synchronization behavior, conflict handling, reconnect behavior, background synchronization, cached data, unavailable features, and user notifications.

## Performance Budgets

Specify budgets for application startup, screen transition, search response, calendar rendering, task loading, conversation loading, AI response streaming, synchronization, memory retrieval, and automation execution.

Budgets should differ for desktop, tablet, and phone.

## Design Token Distribution

Generate design tokens in formats suitable for:

- Figma Variables
- JSON
- CSS Variables
- Tailwind CSS
- Design Tokens Community Group format
- Style Dictionary

Every platform consumes the same canonical token set.

## Component Mapping

For every component, generate:

- Figma Component
- React Component
- CSS Class
- Tailwind Utility Mapping
- Accessibility Specification
- Platform Variants

## Platform Motion System

Motion adapts by platform:

- Desktop: rich transitions.
- Tablet: reduced travel distance.
- Phone: fast interactions.
- Accessibility: reduced-motion mode.

Document duration, easing, spring behavior, fade, scale, slide, streaming, hover, and touch feedback.

## Design QA

Create a Design QA checklist for every screen.

Validate spacing, typography, color, contrast, accessibility, responsiveness, keyboard navigation, touch targets, animations, state changes, empty states, loading states, error states, localization, and dark mode consistency.

## Engineering Handoff

Generate implementation guidance for Next.js, React, TypeScript, Tailwind CSS, CSS Variables, Design Tokens, Storybook, React Aria, and Framer Motion.

For every screen include component hierarchy, folder structure, state ownership, props, hooks, accessibility requirements, responsive rules, animation hooks, and performance considerations.

## Figma Project Organization

Figma pages:

- 01 Foundations
- 02 Variables
- 03 Styles
- 04 Components
- 05 Icons
- 06 Desktop
- 07 Tablet
- 08 Mobile
- 09 User Flows
- 10 Prototypes
- 11 Developer Handoff
- 12 QA

For every component define Auto Layout, variants, properties, interactive components, documentation, and naming convention.

## Cross-Platform Deliverables

The complete design package includes:

- Volume 16: Cross-Platform Design Specification
- Volume 17: Responsive Layout Specification
- Volume 18: Platform Adaptation Guide
- Volume 19: Figma Variables and Design Tokens
- Volume 20: Frontend Component Mapping
- Volume 21: Storybook Specification
- Volume 22: Accessibility Compliance Guide
- Volume 23: Design QA Handbook
- Volume 24: Developer Implementation Handbook

## Final Objective

The completed specification should allow UX designers to build the entire experience in Figma, UI designers to maintain one consistent visual language, frontend engineers to implement every screen without guessing layouts or interactions, backend engineers to understand UI expectations and data dependencies, QA engineers to validate behavior against documented interaction rules, accessibility reviewers to verify compliance, and future AI design tools to generate new screens that conform to the established design system.

Treat the design system as the permanent visual and interaction contract for Day-to-Day Assistant across every supported platform.
