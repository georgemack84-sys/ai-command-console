export type DesktopSidebarState = 'expanded' | 'collapsed';

export interface ShellNavigationItem {
  id: string;
  label: string;
  href: string;
  indicator: string;
  exact?: boolean;
}
