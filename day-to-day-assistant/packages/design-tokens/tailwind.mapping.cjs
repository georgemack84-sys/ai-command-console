module.exports = {
  theme: {
    extend: {
      colors: {
        d2d: {
          background: "var(--d2d-color-background-app)",
          subtle: "var(--d2d-color-background-subtle)",
          panel: "var(--d2d-color-surface-panel)",
          raised: "var(--d2d-color-surface-raised)",
          selected: "var(--d2d-color-surface-selected)",
          text: "var(--d2d-color-text-primary)",
          muted: "var(--d2d-color-text-secondary)",
          accent: "var(--d2d-color-accent)",
          danger: "var(--d2d-color-danger)"
        }
      },
      borderRadius: {
        d2d: "var(--d2d-radius-md)"
      },
      boxShadow: {
        "d2d-sm": "var(--d2d-shadow-sm)",
        "d2d-md": "var(--d2d-shadow-md)"
      },
      transitionTimingFunction: {
        d2d: "var(--d2d-ease-standard)"
      }
    }
  }
};
