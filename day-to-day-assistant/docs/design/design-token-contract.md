# Design Token Contract

All platforms consume one canonical token set. Platform output formats may differ, but token names and semantic meaning must remain stable.

## Canonical Token Groups

- `color.background.*`
- `color.surface.*`
- `color.text.*`
- `color.border.*`
- `color.intent.info|success|warning|danger`
- `space.0|1|2|3|4|5|6|8|10|12`
- `radius.none|sm|md|lg`
- `font.family.ui|mono`
- `font.size.xs|sm|md|lg|xl|2xl`
- `font.weight.regular|medium|semibold|bold`
- `shadow.none|sm|md`
- `motion.duration.fast|base|slow`
- `motion.easing.standard|enter|exit`

## Required Outputs

- Figma Variables
- JSON
- CSS Variables
- Tailwind CSS mapping
- Design Tokens Community Group format
- Style Dictionary source

Implemented repository artifacts:

- `packages/design-tokens/tokens.json`
- `packages/design-tokens/tokens.css`
- `packages/design-tokens/tailwind.mapping.cjs`
- `apps/web/src/styles.css`

## CSS Variable Example

```css
:root {
  --d2d-color-background-app: #f7f8fa;
  --d2d-color-surface-panel: #ffffff;
  --d2d-color-text-primary: #17202a;
  --d2d-space-4: 16px;
  --d2d-radius-md: 8px;
  --d2d-motion-duration-base: 160ms;
}
```

## Tailwind Mapping Example

```js
theme: {
  extend: {
    colors: {
      d2d: {
        background: "var(--d2d-color-background-app)",
        panel: "var(--d2d-color-surface-panel)",
        text: "var(--d2d-color-text-primary)"
      }
    }
  }
}
```
