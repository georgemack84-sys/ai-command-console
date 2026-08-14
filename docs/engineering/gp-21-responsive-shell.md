# GP-21 Responsive Application Shell

GP-21 establishes one persistent structural frame for protected Proprium routes.
It composes GP-19 tokens and GP-20 controls into `ApplicationShell`, a sticky
`ApplicationHeader`, collapsible `DesktopSidebar`, flexible main workspace, and a
shell-presented `MobileNavigationDrawer`, now harmonized with the GP-22 Dialog
behavior layer.

The shell is intentionally domain-neutral. Authentication remains in the
protected layout and is passed through the account slot; permissions, search,
notifications, settings, and business data are not shell dependencies. A static
typed navigation model supplies the single `ShellNavigation` renderer and can be
replaced by a later registry without changing either responsive surface.

The canonical `large` breakpoint is 1024px. CSS controls visibility to keep SSR
and hydration structurally stable. Desktop state is local and non-persistent;
mobile state closes on selection, route change, Escape, backdrop interaction, or
transition to desktop. Modal focus is contained and restored, and document scroll
locking is always released.

Run `npm run repo -- validate shell` for the artifact and controlled-failure
policy gate. The complete frontend gate also runs this validation, unit behavior,
architecture enforcement, formatting, lint, TypeScript, and coverage.

Classification: `FOUNDATION_COMPATIBLE`. GP-21 extends the admitted Week 2 UI
layers and canonical command surface without changing GP-18 baseline authority,
GP-19 tokens/breakpoint values, or GP-20 primitive contracts.
