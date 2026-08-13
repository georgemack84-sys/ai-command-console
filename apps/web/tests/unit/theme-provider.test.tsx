import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { describe, expect, it } from 'vitest';

import { ThemeContext, ThemeProvider } from '@/providers/theme-provider';

function Probe() {
  const theme = useContext(ThemeContext);
  return <span>{theme?.resolvedTheme}</span>;
}

describe('ThemeProvider', () => {
  it('applies only a resolved root theme while preserving other attributes', () => {
    document.documentElement.setAttribute('lang', 'en');
    localStorage.setItem('proprium.theme.preference', 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});
