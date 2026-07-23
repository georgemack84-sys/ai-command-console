import type { TemporaryNavigationItem } from '../state/contracts';
export const temporaryNavigation: readonly TemporaryNavigationItem[] = [
  { id: 'home', label: 'Home', href: '/', exact: true },
  { id: 'gallery', label: 'Component Gallery', href: '/components' },
  { id: 'shell-states', label: 'Shell States', href: '/shell-states' },
];
export function isActiveRoute(pathname: string, item: TemporaryNavigationItem) {
  const normalized =
    (pathname.split(/[?#]/)[0] ?? '/').replace(/\/$/, '') || '/';
  return item.exact
    ? normalized === item.href
    : normalized === item.href || normalized.startsWith(`${item.href}/`);
}
