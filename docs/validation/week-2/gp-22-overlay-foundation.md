# GP-22 Overlay Foundation Qualification

Qualification requires the overlay policy and its five controlled failures,
strict TypeScript, lint, dependency architecture, unit behavior, browser-backed
Storybook interaction and Axe coverage, responsive 320px validation, production
Storybook and Next.js builds, authenticated shell regression checks, repository
validation, and the complete infrastructure-independent source gate.

Browser evidence covers Dialog focus containment and restoration, AlertDialog
safe initial focus and outside-interaction policy, DropdownMenu arrows/Home/Escape,
disabled items and activation, a menu-to-AlertDialog transition, long modal
content, light/dark portal theming, reduced motion, shell layering, and serious or
critical Axe violations.

Controlled fixtures reject direct low-level primitive imports, arbitrary focus
timers, raw overlay colors, missing required stories, and lost collision padding.
Final command outcomes are recorded in the implementation handoff.

Foundation classification: `FOUNDATION_COMPATIBLE`.
