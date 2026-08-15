'use client';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
} from 'react';

import { classNames } from './class-names';

function overlayRoot() {
  return document.getElementById('proprium-overlay-root') ?? undefined;
}

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    {...props}
    ref={ref}
    className={classNames('ui-dialog__title', className)}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    {...props}
    ref={ref}
    className={classNames('ui-dialog__description', className)}
  />
));
DialogDescription.displayName = 'DialogDescription';

export interface DialogContentProps extends ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  size?: 'small' | 'medium' | 'large';
  overlayClassName?: string;
}

export const DialogContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    { children, className, overlayClassName, size = 'medium', ...props },
    ref,
  ) => (
    <DialogPrimitive.Portal
      container={typeof document === 'undefined' ? undefined : overlayRoot()}
    >
      <DialogPrimitive.Overlay
        className={classNames('ui-dialog-backdrop', overlayClassName)}
      />
      <DialogPrimitive.Content
        {...props}
        ref={ref}
        data-size={size}
        className={classNames('ui-dialog-content', className)}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DialogContent.displayName = 'DialogContent';

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={classNames('ui-dialog__header', className)} />
  );
}

export function DialogBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={classNames('ui-dialog__body', className)} />
  );
}

export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={classNames('ui-dialog__footer', className)} />
  );
}

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export const AlertDialogTitle = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    {...props}
    ref={ref}
    className={classNames('ui-dialog__title', className)}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    {...props}
    ref={ref}
    className={classNames('ui-dialog__description', className)}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

export interface AlertDialogContentProps extends ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Content
> {
  size?: 'small' | 'medium';
}

export const AlertDialogContent = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ children, className, size = 'small', ...props }, ref) => (
  <AlertDialogPrimitive.Portal
    container={typeof document === 'undefined' ? undefined : overlayRoot()}
  >
    <AlertDialogPrimitive.Overlay className="ui-dialog-backdrop" />
    <AlertDialogPrimitive.Content
      {...props}
      ref={ref}
      data-size={size}
      className={classNames('ui-dialog-content', className)}
    >
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export type DropdownMenuContentProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
>;

export const DropdownMenuContent = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(
  (
    { children, className, sideOffset = 8, collisionPadding = 8, ...props },
    ref,
  ) => (
    <DropdownMenuPrimitive.Portal
      container={typeof document === 'undefined' ? undefined : overlayRoot()}
    >
      <DropdownMenuPrimitive.Content
        {...props}
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={classNames('ui-dropdown', className)}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  ),
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuItemProps extends ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> {
  variant?: 'default' | 'danger';
}

export const DropdownMenuItem = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, variant = 'default', ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    {...props}
    ref={ref}
    data-variant={variant}
    className={classNames('ui-dropdown__item', className)}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    {...props}
    ref={ref}
    className={classNames('ui-dropdown__separator', className)}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
