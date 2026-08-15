'use client';
import { useContext } from 'react';

import { ThemeContext } from '@/providers/theme-provider';

import type { Meta, StoryObj } from '@storybook/react';
function ThemeProviderSmoke() {
  const theme = useContext(ThemeContext);
  return (
    <main>
      <h1>Theme provider</h1>
      <p>
        Preference: {theme?.preference}; resolved: {theme?.resolvedTheme}
      </p>
      <button onClick={() => theme?.setPreference('dark')}>Set dark</button>
    </main>
  );
}
export default {
  title: 'Foundations/Theme provider smoke',
  component: ThemeProviderSmoke,
} satisfies Meta<typeof ThemeProviderSmoke>;
export const Default: StoryObj<typeof ThemeProviderSmoke> = {};
