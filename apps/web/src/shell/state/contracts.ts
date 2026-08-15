export type DesktopSidebarState = 'expanded' | 'collapsed';
export type MobileDrawerState = 'open' | 'closed';

export interface ShellNavigationItem {
  id: string;
  label: string;
  href: string;
  indicator: string;
  exact?: boolean;
}
