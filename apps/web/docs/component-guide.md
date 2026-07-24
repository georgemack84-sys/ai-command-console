# Shared UI component guide

Import shared components only from `@/ui/components`.

## Actions and fields

`Button` defaults to `type="button"`; set `type="submit"` explicitly for form submission. Do not use a Button as a navigation link. `IconButton` requires a non-empty accessible label. `Field` supplies label, description, and error associations; placeholders never replace labels. `Input` and `Textarea` retain native attributes and forward refs.

## Content and feedback

`Card` is non-interactive. `Spinner` is decorative without a label and announces progress with one. `Skeleton` is always hidden from assistive technology. `EmptyState` represents an absence of content, not loading or failure. Use `ErrorState` for recoverable failures and `UnavailableState` for temporary operational absence; do not pass raw exceptions, stacks, tokens, paths, or backend payloads to either.

## Overlays

`Dialog`, `AlertDialog`, and `DropdownMenu` are Proprium-owned wrappers and target the canonical overlay root. Do not import Radix primitives directly. Standard Dialogs may be dismissed with Escape. Alert Dialogs are for explicit confirmation; use a cancellation path and never treat Escape as confirmation. Feature code must not manage body scroll or focus traps directly.
