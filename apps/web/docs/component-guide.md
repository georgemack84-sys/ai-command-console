# Shared UI component guide

Import production components only from `@/ui/components`. The compatibility module
`@/ui/components/primitives` remains available to admitted consumers, but new code
uses the public barrel. Component-owned styles live beside the implementation and
consume GP-19 semantic tokens; consumers may add layout hooks with `className` but
must not replace the component's visual or interaction contract.

## Actions

`Button` defaults to `type="button"`; set `type="submit"` explicitly for form
submission. It forwards its native ref and props. The deliberately small size set
is `small`, `medium`, and `large`.

| Variant     | Use                                                    |
| ----------- | ------------------------------------------------------ |
| `primary`   | The single leading action in a region                  |
| `secondary` | A supporting action with normal emphasis               |
| `outline`   | A lower-emphasis action that still needs a boundary    |
| `ghost`     | A quiet utility action in an already-defined surface   |
| `danger`    | An action with destructive or irreversible consequence |

Loading buttons retain their visible label width, set `aria-busy`, and disable
duplicate activation. `IconButton` requires the typed `label` prop and guarantees a
touch-sized target; the icon remains decorative. Do not use either component as a
navigation link.

## Fields

`Input` and `Textarea` retain native attributes and forward refs. `Textarea` is
vertically resizable. `Label`, `FieldDescription`, and `FieldError` are exported for
specialized compositions, while `Field` is the canonical relationship owner:

```tsx
<Field
  label="Email address"
  description="Used for account notifications."
  required
>
  <Input type="email" autoComplete="email" />
</Field>

<Field label="Email address" error="Enter a valid email address.">
  <Input type="email" />
</Field>
```

`Field` creates stable React IDs when needed, preserves an explicit control ID and
existing `aria-describedby` value, and associates help and error text. It displays
validation results but never owns domain validation. Placeholders never replace
labels, and invalid state is communicated through text and `aria-invalid`, not color
alone.

## Cards

`Card` has `default`, `subtle`, `outlined`, and `elevated` visual variants. Its
header, title, description, content, and footer parts provide layout only. In
particular, `CardTitle` does not invent a heading level, and `Card` does not add a
landmark or click behavior. Consumers supply context-appropriate headings, links,
or buttons.

## Loading and reusable states

`Spinner` is decorative without a label and announces progress only when given one.
Prefer `LoadingState` when a visible status label is needed. `Skeleton` is always
hidden from assistive technology. Spinner and Skeleton animation stops under
reduced-motion preferences.

- `EmptyState`: the request or view succeeded but contains no content.
- `ErrorState`: the intended operation or view failed.
- `UnavailableState`: the capability exists but cannot currently be used.

All three accept composed actions without owning routing or refetch behavior. Never
pass raw exceptions, stacks, tokens, paths, connection strings, or backend payloads
to a reusable state component.

Route-level compositions are documented in [Route-state UX](route-state-ux.md).
Use `RouteLoadingState`, `RouteErrorState`, and `RouteNotFoundState` from
`@/ui/route-states` only for route outcomes; they compose these GP-20 primitives
and do not replace `EmptyState` or `UnavailableState` semantics.

## Contribution contract

Every new reusable interactive component ships with semantic behavioral tests and a
deterministic Storybook story. Run `npm run repo -- validate components`,
`npm run repo -- validate frontend`, and `npm run repo -- build storybook`. The
component validator rejects missing API/accessibility contracts, application-layer
imports, raw colors, unresolved tokens, lost motion handling, and missing core
stories; controlled negative fixtures prove those failures close the gate.

Route-boundary changes additionally run `npm run repo -- validate route-states`.

## Overlays

Proprium owns typed wrappers over the single approved Radix behavior layer. All
portaled content targets `#proprium-overlay-root` when present and otherwise uses
Radix's body portal for Storybook compatibility. Feature code imports only from
`@/ui/components`; direct Radix imports, fixed-position portal markup, focus traps,
scroll locks, and global Escape handlers are prohibited outside the wrapper.

Use this decision rule:

- focused, compact modal content → `Dialog`;
- an explicit consequential decision → `AlertDialog`;
- a keyboard-navigable list of actions → `DropdownMenu`;
- small arbitrary anchored contextual UI → Popover, once a concrete reusable need
  justifies adding it. GP-22 does not implement Popover.

Compose Dialog from `DialogTrigger`, `DialogContent`, `DialogHeader`,
`DialogTitle`, optional `DialogDescription`, `DialogBody`, `DialogFooter`, and
`DialogClose`. Every dialog requires an accessible title. Content supports
small/medium/large responsive widths, viewport-bounded scrolling, controlled or
uncontrolled state, and low-level focus callbacks for documented exceptional
workflows. Prefer route content for spacious, deeply navigable, or multi-step work.

AlertDialog requires a title, consequence description, explicit cancel, and
explicit action. Place the safe cancel action first so it receives initial focus.
Outside pointer interaction does not dismiss it. DropdownMenu supports semantic
items, separators, disabled state, danger styling, collision handling, arrows,
Home/End, Escape, and typeahead through Radix. A destructive menu item may exist,
but an irreversible operation should transition to AlertDialog when confirmation
is required.

Escape closes only the topmost dismissible overlay. Application code must not
fight focus restoration using arbitrary `setTimeout(() => element.focus())`
patterns. Overlays consume GP-19 surfaces, layers, spacing, focus, and motion;
reduced-motion preferences remove their transitions.
