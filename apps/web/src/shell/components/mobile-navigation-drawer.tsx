import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  IconButton,
} from '@/ui/components';

import { ShellNavigation } from './shell-navigation';

import type { ShellNavigationItem } from '../state/contracts';
import type { RefObject } from 'react';

export interface MobileNavigationDrawerProps {
  open: boolean;
  pathname: string;
  navigation: readonly ShellNavigationItem[];
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function MobileNavigationDrawer({
  open,
  pathname,
  navigation,
  triggerRef,
  onClose,
}: MobileNavigationDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        id="mobile-navigation"
        className="mobile-drawer"
        overlayClassName="mobile-drawer-backdrop"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.querySelector<HTMLElement>('.mobile-drawer button')?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <div className="mobile-drawer__header">
          <DialogTitle>Navigation</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a destination in the application.
          </DialogDescription>
          <DialogClose asChild>
            <IconButton variant="ghost" label="Close navigation" icon="×" />
          </DialogClose>
        </div>
        <ShellNavigation
          items={navigation}
          pathname={pathname}
          onNavigate={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
