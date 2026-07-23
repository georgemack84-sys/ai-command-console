'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { createPortal } from 'react-dom';

function OverlaySmoke() {
  const root =
    typeof document === 'undefined'
      ? null
      : document.getElementById('proprium-overlay-root');
  return (
    <main>
      <h1>Overlay root</h1>
      <p>The temporary overlay uses the production portal contract.</p>
      {root
        ? createPortal(
            <div
              role="status"
              style={{
                position: 'fixed',
                inset: 'auto var(--space-4) var(--space-4) auto',
                zIndex: 'var(--layer-toast)',
                background: 'var(--surface-overlay)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                boxShadow: 'var(--shadow-floating)',
              }}
            >
              Overlay smoke
            </div>,
            root,
          )
        : null}
    </main>
  );
}

export default {
  title: 'Foundations/Overlay smoke',
  component: OverlaySmoke,
} satisfies Meta<typeof OverlaySmoke>;
export const Default: StoryObj<typeof OverlaySmoke> = {};
