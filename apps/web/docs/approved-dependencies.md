# Approved frontend dependencies

| Package                         | Scope       | Purpose                                 | Rationale and removal condition                                                                                                | ADR                    |
| ------------------------------- | ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `storybook`                     | development | Component workshop and static build     | Required for production-parity component development; remove only if replaced by an approved equivalent.                       | ADR-012                |
| `@storybook/nextjs-vite`        | development | Next.js/Vite Storybook framework        | Uses the app’s existing Next.js and TypeScript conventions without a parallel bundler configuration.                           | ADR-012                |
| `@storybook/addon-a11y`         | development | Accessibility feedback in smoke stories | Makes foundational accessibility failures visible during development; remove only with a replacement accessibility check.      | ADR-012                |
| `@playwright/test`              | development | Browser tests for app and built stories | Verifies shell behavior, Axe results, and public Storybook interactions in Chromium; remove only with an approved replacement. | Day 4 validation       |
| `@radix-ui/react-dialog`        | production  | Accessible dialog primitive             | Supplies portal, focus containment, restoration, and dismissal behavior behind Proprium-owned wrappers.                        | Day 4 overlay decision |
| `@radix-ui/react-alert-dialog`  | production  | Explicit confirmation primitive         | Prevents unsafe outside dismissal behind Proprium-owned wrappers.                                                              | Day 4 overlay decision |
| `@radix-ui/react-dropdown-menu` | production  | Accessible action menu primitive        | Supplies keyboard navigation and collision-aware positioning behind Proprium-owned wrappers.                                   | Day 4 overlay decision |

No CSS-in-JS runtime, theme framework, state library, icon library, or component framework is introduced for Day 1.
