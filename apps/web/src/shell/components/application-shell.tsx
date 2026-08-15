'use client';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

import { breakpoints } from '@/config/breakpoints';

import { defaultShellNavigation } from '../navigation/navigation-model';

import { ApplicationHeader } from './application-header';
import { DesktopSidebar } from './desktop-sidebar';
import { MobileNavigationDrawer } from './mobile-navigation-drawer';

import type {
  DesktopSidebarState,
  ShellNavigationItem,
} from '../state/contracts';

export interface ApplicationShellProps extends PropsWithChildren {
  navigation?: readonly ShellNavigationItem[];
  headerTitle?: ReactNode;
  headerActions?: ReactNode;
  accountSlot?: ReactNode;
  defaultSidebarState?: DesktopSidebarState;
  defaultMobileNavigationOpen?: boolean;
}

export function ApplicationShell({
  children,
  navigation = defaultShellNavigation,
  headerTitle = 'Workspace',
  headerActions,
  accountSlot,
  defaultSidebarState = 'expanded',
  defaultMobileNavigationOpen = false,
}: ApplicationShellProps) {
  const pathname = usePathname();
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const [sidebarState, setSidebarState] =
    useState<DesktopSidebarState>(defaultSidebarState);
  const [mobileNavigation, setMobileNavigation] = useState({
    open: defaultMobileNavigationOpen,
    pathname,
  });
  const mobileNavigationOpen =
    mobileNavigation.pathname === pathname && mobileNavigation.open;
  const closeMobileNavigation = useCallback(
    () => setMobileNavigation((value) => ({ ...value, open: false })),
    [],
  );

  useEffect(() => {
    const desktopQuery = window.matchMedia(
      `(min-width: ${breakpoints.large}px)`,
    );
    const closeAtDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) closeMobileNavigation();
    };
    closeAtDesktop(desktopQuery);
    desktopQuery.addEventListener('change', closeAtDesktop);
    return () => desktopQuery.removeEventListener('change', closeAtDesktop);
  }, [closeMobileNavigation]);

  return (
    <div className="shell" data-sidebar={sidebarState}>
      <a className="skip-link" href="#main-workspace">
        Skip to main content
      </a>
      <ApplicationHeader
        ref={mobileTriggerRef}
        title={headerTitle}
        actions={headerActions}
        account={accountSlot}
        mobileNavigationOpen={mobileNavigationOpen}
        onOpenMobileNavigation={() =>
          setMobileNavigation({ open: true, pathname })
        }
      />
      <DesktopSidebar
        state={sidebarState}
        pathname={pathname}
        navigation={navigation}
        onToggle={() =>
          setSidebarState((value) =>
            value === 'expanded' ? 'collapsed' : 'expanded',
          )
        }
      />
      <main id="main-workspace" tabIndex={-1} className="shell-main">
        {children}
      </main>
      <MobileNavigationDrawer
        open={mobileNavigationOpen}
        pathname={pathname}
        navigation={navigation}
        triggerRef={mobileTriggerRef}
        onClose={closeMobileNavigation}
      />
    </div>
  );
}
