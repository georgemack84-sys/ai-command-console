'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { breakpoints } from '@/config/breakpoints';
import { acquireScrollLock } from '@/ui/components/scroll-lock';
import {
  temporaryNavigation,
  isActiveRoute,
} from '../navigation/temporary-navigation';
import {
  DESKTOP_SIDEBAR_STORAGE_KEY,
  type DesktopSidebarState,
  type MobileDrawerState,
} from '../state/contracts';
import { UserMenu } from '@/components/auth/user-menu';

function readDesktopState(): DesktopSidebarState {
  try {
    return localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY) === 'collapsed'
      ? 'collapsed'
      : 'expanded';
  } catch {
    return 'expanded';
  }
}
export function ApplicationShell({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const [desktop, setDesktop] = useState<DesktopSidebarState>('expanded');
  const [drawerState, setDrawerState] = useState<MobileDrawerState>('closed');
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${breakpoints.large}px)`);
    const update = () => {
      setIsDesktop(query.matches);
      if (query.matches) setDrawerState('closed');
    };
    queueMicrotask(() => {
      setDesktop(readDesktopState());
      update();
    });
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (drawerState !== 'open') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerState('closed');
      if (event.key === 'Tab' && drawer.current) {
        const focusable =
          drawer.current.querySelectorAll<HTMLElement>('button,a[href]');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const triggerElement = trigger.current;
    const releaseScrollLock = acquireScrollLock();
    drawer.current?.querySelector<HTMLElement>('button')?.focus();
    window.addEventListener('keydown', onKey);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', onKey);
      triggerElement?.focus();
    };
  }, [drawerState]);
  const setSidebar = () =>
    setDesktop((value) => {
      const next = value === 'expanded' ? 'collapsed' : 'expanded';
      try {
        localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  const navigation = (mobile = false) => (
    <nav aria-label="Primary navigation">
      {temporaryNavigation.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={isActiveRoute(pathname, item) ? 'page' : undefined}
          className="shell-nav-link"
          onClick={() => mobile && setDrawerState('closed')}
        >
          {desktop === 'collapsed' && !mobile ? (
            <span aria-hidden>•</span>
          ) : null}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="shell" data-desktop={isDesktop} data-sidebar={desktop}>
      <a className="skip-link" href="#main-workspace">
        Skip to main content
      </a>
      <header className="shell-header">
        <button
          ref={trigger}
          className="shell-mobile-trigger"
          aria-label="Open navigation"
          onClick={() => setDrawerState('open')}
        >
          Menu
        </button>
        <strong>Proprium</strong>
        <UserMenu />
      </header>
      {isDesktop ? (
        <aside className="desktop-sidebar">
          {navigation()}
          <button
            onClick={setSidebar}
            aria-label={
              desktop === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'
            }
          >
            {desktop === 'expanded' ? 'Collapse' : 'Expand'}
          </button>
        </aside>
      ) : null}
      <main id="main-workspace" tabIndex={-1} className="shell-main">
        {children}
      </main>
      {!isDesktop && drawerState === 'open' ? (
        <>
          <button
            className="drawer-backdrop"
            aria-label="Close navigation"
            onClick={() => setDrawerState('closed')}
          />
          <aside
            ref={drawer}
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <button onClick={() => setDrawerState('closed')}>
              Close navigation
            </button>
            {navigation(true)}
          </aside>
        </>
      ) : null}
    </div>
  );
}
