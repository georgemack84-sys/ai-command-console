# Design QA Handbook

Every screen must pass this checklist before design or implementation acceptance.

## Screen Checklist

- Spacing follows canonical tokens.
- Typography hierarchy is clear and does not overflow containers.
- Color usage matches semantic intent.
- Contrast passes WCAG AA.
- Keyboard navigation reaches all interactive elements.
- Touch targets meet platform minimums.
- Responsive states match the breakpoint specification.
- Animations have reduced-motion alternatives.
- Empty states explain the immediate condition.
- Loading states preserve layout stability.
- Error states identify what happened and how to recover.
- Localization does not break layout with longer strings.
- Dark mode remains semantically consistent.
- Focus indicators are visible.
- Tables become readable cards on narrow screens.
- Dialogs trap focus and restore focus after close.
- Calendar and assistant workspaces remain usable at every supported breakpoint.

## Platform QA

- Windows: verify keyboard shortcuts, context menus, notifications, file dialogs, and window resizing.
- macOS: verify menu bar expectations, trackpad gestures, notifications, file handling, and clipboard behavior.
- Tablets: verify touch, pointer, split-screen, drawer, and keyboard accessory behavior.
- Phones: verify bottom navigation, stacked screens, fast create flows, full-screen conversations, and safe-area handling.
