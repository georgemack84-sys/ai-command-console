# Frontend Component Mapping

Each screen handoff must map Figma components to implementation components and accessibility requirements.

| Figma Component | React Component | CSS Class | Tailwind Mapping | Accessibility | Platform Variants |
| --- | --- | --- | --- | --- | --- |
| App Shell | `AppShell` | `.app-shell` | grid, min-h-screen | landmark regions, skip link | desktop sidebar, tablet drawer, phone bottom nav |
| Sidebar | `PrimaryNav` | `.nav` | flex, gap, border | aria-label, aria-current | persistent, collapsible, drawer |
| Top Bar | `TopBar` | `.topbar` | flex, items-center | status text, user menu labels | browser/native window aware |
| Summary Card | `SummaryCard` | `.summary-card` | rounded-md, border, p-4 | heading level discipline | grid card, compact card |
| Data List | `DataList` | `.list` | grid, gap | list semantics where useful | cards on phone |
| Form Field | `Field` | `.field` | flex, gap | label, describedby, error role | touch target expansion |
| Modal | `Dialog` | `.dialog` | fixed, shadow | focus trap, escape close | modal desktop, sheet phone |
| Context Panel | `ContextPanel` | `.context-panel` | aside, border | labelled aside | right panel, drawer, stacked cards |
| Calendar Grid | `CalendarGrid` | `.calendar-grid` | grid | keyboard date navigation | month/week desktop, agenda phone |
| Conversation Workspace | `ConversationWorkspace` | `.assistant-workspace` | grid | message roles and live regions | three panel, two panel, stack |

## Engineering Handoff Requirements

For every screen define:

- component hierarchy;
- folder structure;
- state ownership;
- props;
- hooks;
- accessibility requirements;
- responsive rules;
- animation hooks;
- performance considerations.

Preferred implementation tools for future production frontend expansion are Next.js, React, TypeScript, Tailwind CSS, CSS Variables, Storybook, React Aria, and Framer Motion. The current static web shell implements the canonical app shell, responsive navigation variants, shared card/form/list classes, CSS variables, breakpoint behavior, and reduced-motion support until a framework migration is approved.
