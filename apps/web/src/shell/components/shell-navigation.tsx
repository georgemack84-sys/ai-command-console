import Link from 'next/link';

import { isActiveRoute } from '../navigation/navigation-model';

import type { ShellNavigationItem } from '../state/contracts';

export interface ShellNavigationProps {
  items: readonly ShellNavigationItem[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function ShellNavigation({
  items,
  pathname,
  collapsed = false,
  onNavigate,
}: ShellNavigationProps) {
  return (
    <nav
      className="shell-navigation"
      aria-label="Primary navigation"
      data-collapsed={collapsed || undefined}
    >
      <ul className="shell-navigation__list">
        {items.map((item) => {
          const current = isActiveRoute(pathname, item);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                className="shell-nav-link"
                onClick={onNavigate}
              >
                <span className="shell-nav-indicator" aria-hidden>
                  {item.indicator}
                </span>
                <span className="shell-nav-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
