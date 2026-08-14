import { useEffect, useRef, type RefObject } from 'react';

import { IconButton } from '@/ui/components';
import { acquireScrollLock } from '@/ui/components/scroll-lock';

import { ShellNavigation } from './shell-navigation';

import type { ShellNavigationItem } from '../state/contracts';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface MobileNavigationDrawerProps {
  open: boolean;
  pathname: string;
  navigation: readonly ShellNavigationItem[];
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function MobileNavigationDrawer({
  open,
  pathname,
  navigation,
  triggerRef,
  onClose,
}: MobileNavigationDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const releaseScrollLock = acquireScrollLock();
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>(focusableSelector)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !drawer) return;
      const focusable = [
        ...drawer.querySelectorAll<HTMLElement>(focusableSelector),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      releaseScrollLock();
      trigger?.focus();
    };
  }, [onClose, open, triggerRef]);

  if (!open) return null;
  return (
    <>
      <div className="mobile-drawer-backdrop" onPointerDown={onClose} />
      <aside
        ref={drawerRef}
        id="mobile-navigation"
        className="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-navigation-title"
      >
        <div className="mobile-drawer__header">
          <h2 id="mobile-navigation-title">Navigation</h2>
          <IconButton
            variant="ghost"
            label="Close navigation"
            icon="×"
            onClick={onClose}
          />
        </div>
        <ShellNavigation
          items={navigation}
          pathname={pathname}
          onNavigate={onClose}
        />
      </aside>
    </>
  );
}
