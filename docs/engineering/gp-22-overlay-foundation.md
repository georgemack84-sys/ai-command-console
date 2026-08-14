# GP-22 Overlay Interaction Foundation

GP-22 promotes the admitted Radix primitives into Proprium's single production
overlay behavior layer. Repository-owned, typed wrappers expose Dialog,
AlertDialog, and DropdownMenu composition while retaining Radix portal, focus
scope, topmost Escape ownership, modal isolation, scroll lock, restoration,
keyboard navigation, typeahead, and collision handling.

The canonical portal target is the root layout's `#proprium-overlay-root`; wrappers
fall back to the maintained primitive's body portal in Storybook. Presentation
uses only GP-19 semantic surfaces, layers, spacing, radii, shadows, focus, and
motion. GP-21's mobile drawer consumes Dialog behavior so there is no competing
focus or Escape implementation.

Popover is `NOT APPLICABLE` in GP-22 because no immediate reusable Week 2
interaction needs arbitrary anchored content. Adding a primitive solely because
the library offers it would widen the public API without a validated consumer.

Run `npm run repo -- validate overlays` for ownership, artifact, style, story, and
controlled-failure checks. Application code must import the public wrapper barrel,
provide accessible titles and descriptions appropriate to the interaction, and
leave focus, Escape, outside dismissal, and scroll mechanics to the overlay layer.

Classification: `FOUNDATION_COMPATIBLE`. The work hardens admitted dependencies
and replaces GP-21's provisional custom modal mechanics without changing GP-19,
GP-20, or GP-21 consumer intent.
