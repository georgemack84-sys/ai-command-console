export type DesktopSidebarState = 'expanded' | 'collapsed';
export type MobileDrawerState = 'open' | 'closed';
export const DESKTOP_SIDEBAR_STORAGE_KEY = 'proprium.shell.desktop-sidebar.v1';

export interface TemporaryNavigationItem {
  id: string;
  label: string;
  href: string;
  exact?: boolean;
}
