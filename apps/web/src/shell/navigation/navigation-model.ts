import type { ShellNavigationItem } from '../state/contracts';

export const defaultShellNavigation: readonly ShellNavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    exact: true,
    indicator: 'DB',
  },
  {
    id: 'components',
    label: 'Component Gallery',
    href: '/components',
    indicator: 'UI',
  },
  {
    id: 'shell-states',
    label: 'Shell States',
    href: '/shell-states',
    indicator: 'ST',
  },
];

export function isActiveRoute(
  pathname: string,
  item: ShellNavigationItem,
): boolean {
  const normalized =
    (pathname.split(/[?#]/)[0] ?? '/').replace(/\/$/, '') || '/';
  return item.exact
    ? normalized === item.href
    : normalized === item.href || normalized.startsWith(`${item.href}/`);
}
