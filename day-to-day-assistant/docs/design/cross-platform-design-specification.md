# Cross-Platform Design Specification

The Desktop Web application is the canonical product experience. Other clients inherit the same information architecture, design tokens, component library, motion language, accessibility expectations, and authority boundaries.

## Feature Adaptation Matrix

| Feature | Desktop Web | Windows | macOS | iPad | Android Tablet | iPhone | Android Phone |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Today | Dashboard with dense cards and context panel | Native window, Fluent menus | Native window, menu bar commands | Two-column dashboard | Two-column dashboard | Priority cards and quick actions | Priority cards and quick actions |
| Tasks | Lists, filters, detail side panel | Keyboard and context menus | Keyboard, trackpad, menu bar | Split list/detail | Split list/detail | Stacked list/detail | Stacked list/detail |
| Reminders | Table/list plus delivery history | Toast integration | Notification Center integration | Touch-first scheduling | Touch-first scheduling | Quick create and snooze | Quick create and snooze |
| Calendar | Month/week/day/agenda with conflicts | Native notification hooks | Calendar-like gestures where appropriate | Week/day focus | Week/day focus | Agenda/day first | Agenda/day first |
| Notes | Notebook list, editor, attachments | File drag/drop | File drag/drop and share sheet | Editor plus notebook drawer | Editor plus notebook drawer | Fast capture and reading | Fast capture and reading |
| Search | Global search with filters | Keyboard-first | Keyboard-first | Search drawer | Search drawer | Full-screen search | Full-screen search |
| Assistant | Three-panel workspace | Resizable desktop panels | Resizable desktop panels | Two-panel workspace | Two-panel workspace | Conversation-first stack | Conversation-first stack |
| Memory | Reviewable memory dashboard | Same as desktop | Same as desktop | Collapsible filters | Collapsible filters | Approval queue first | Approval queue first |
| Automation | Dense operational table | Same as desktop | Same as desktop | Simplified cards | Simplified cards | Enable/disable and recent runs | Enable/disable and recent runs |
| Connectors | Registry, health, sync history | Desktop context menus | Desktop context menus | Drawer details | Drawer details | Status and reconnect actions | Status and reconnect actions |
| Operations | Diagnostics, backups, release evidence | File picker restore workflows | File picker restore workflows | Backup status and checks | Backup status and checks | Health and backup status | Health and backup status |

## Shared Components

| Shared Component | Platform Variant | Responsive Variant | Accessibility Variant | Motion Variant |
| --- | --- | --- | --- | --- |
| App Shell | Browser, native desktop window, tablet shell, phone shell | Sidebar to drawer to bottom nav | Landmarks and skip links | Panel slide with reduced-motion fallback |
| Navigation | Persistent sidebar on desktop | Native menu support on desktop clients | Collapsed drawer on tablet, bottom nav on phone | Roving focus, visible current route | Short slide/fade |
| Context Panel | Right panel | Native resizable pane | Drawer or stacked cards | Focus trap in drawer | Slide from edge |
| Data Card | Shared card style | Platform-native shadows kept restrained | Grid to single column | Semantic headings | Fade/position only |
| Form | Shared labels, validation, errors | Platform input conventions | Single column on narrow screens | Field errors tied by ARIA | Error reveal fade |
| Dialog | Modal or sheet | Desktop modal, mobile full-screen sheet | Width capped by breakpoint | Focus trap, escape handling | Scale/fade desktop, slide mobile |
| Toast | In-app notification | Native notification bridge where available | Bottom or top depending nav | Status role where appropriate | Quick fade |

## Responsive Rules

| Breakpoint | Grid | Navigation | Panels | Tables | Calendar | Assistant |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop >=1440 | 12 columns | Persistent sidebar | Left/main/right available | Full tables | Month/week/day/agenda | Three panels |
| Laptop 1200-1439 | 12 columns | Persistent sidebar | Context panel collapsible | Full tables with compact density | Month/week/day | Three panels with narrower context |
| Tablet Landscape 992-1199 | 8 columns | Collapsible sidebar | Context drawer | Priority columns | Week/day/agenda | Two panels |
| Tablet Portrait 768-991 | 6 columns | Collapsible sidebar | Drawer | Card tables | Day/agenda | Two panels or stacked |
| Phone Landscape 576-767 | 4 columns | Bottom nav and drawer | Stacked cards | Cards | Agenda/day | Conversation stack |
| Phone Portrait <=575 | 4 columns | Bottom nav | Stacked cards | Cards | Agenda first | Full-screen conversation |

## Offline Strategy

Offline-capable areas include Today data already cached locally, tasks, reminders, calendar records, notes, notebooks, memory review, automation inspection, and diagnostics generated from local state.

Unavailable while offline: hosted AI responses, external connector synchronization, remote file provider refresh, and any future cloud-only notification bridge.

Reconnect behavior must show sync status, preserve local changes, run conflict detection, and require confirmation before destructive merges.

## Performance Budgets

| Capability | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Startup | <=2.0s local warm start | <=2.5s | <=3.0s |
| Screen transition | <=150ms | <=180ms | <=200ms |
| Search response | <=300ms local index | <=350ms | <=400ms |
| Calendar render | <=400ms | <=500ms | <=500ms agenda/day |
| Task loading | <=250ms | <=300ms | <=350ms |
| Conversation loading | <=400ms | <=500ms | <=600ms |
| AI streaming first token | <=1.5s after provider response begins | <=1.8s | <=2.0s |
| Synchronization status update | <=500ms | <=600ms | <=700ms |
| Memory retrieval | <=350ms | <=450ms | <=500ms |
| Automation execution feedback | <=500ms | <=600ms | <=700ms |
