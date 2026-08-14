import { forwardRef, type ReactNode } from 'react';

import { IconButton } from '@/ui/components';

export interface ApplicationHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
  account?: ReactNode;
  mobileNavigationOpen: boolean;
  onOpenMobileNavigation: () => void;
}

export const ApplicationHeader = forwardRef<
  HTMLButtonElement,
  ApplicationHeaderProps
>(
  (
    { title, actions, account, mobileNavigationOpen, onOpenMobileNavigation },
    ref,
  ) => (
    <header className="shell-header">
      <IconButton
        ref={ref}
        className="shell-mobile-trigger"
        variant="ghost"
        label={mobileNavigationOpen ? 'Navigation is open' : 'Open navigation'}
        icon="☰"
        aria-expanded={mobileNavigationOpen}
        aria-controls="mobile-navigation"
        onClick={onOpenMobileNavigation}
      />
      <div className="shell-header__title">{title}</div>
      {actions ? <div className="shell-header__actions">{actions}</div> : null}
      {account ? <div className="shell-header__account">{account}</div> : null}
    </header>
  ),
);
ApplicationHeader.displayName = 'ApplicationHeader';
