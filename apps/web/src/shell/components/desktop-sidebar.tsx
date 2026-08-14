import { IconButton } from '@/ui/components';

import { ShellNavigation } from './shell-navigation';

import type {
  DesktopSidebarState,
  ShellNavigationItem,
} from '../state/contracts';

export interface DesktopSidebarProps {
  state: DesktopSidebarState;
  pathname: string;
  navigation: readonly ShellNavigationItem[];
  onToggle: () => void;
}

export function DesktopSidebar({
  state,
  pathname,
  navigation,
  onToggle,
}: DesktopSidebarProps) {
  const expanded = state === 'expanded';
  return (
    <aside className="desktop-sidebar" aria-label="Application sidebar">
      <div className="desktop-sidebar__brand">
        <span className="desktop-sidebar__mark" aria-hidden>
          P
        </span>
        <strong className="desktop-sidebar__brand-label">Proprium</strong>
      </div>
      <ShellNavigation
        items={navigation}
        pathname={pathname}
        collapsed={!expanded}
      />
      <IconButton
        className="desktop-sidebar__collapse"
        variant="ghost"
        label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        icon={expanded ? '‹' : '›'}
        aria-expanded={expanded}
        onClick={onToggle}
      />
    </aside>
  );
}
