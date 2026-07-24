'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { useEffect, useState, type ReactNode } from 'react';
import { acquireScrollLock } from './scroll-lock';

function overlayRoot() {
  return document.getElementById('proprium-overlay-root') ?? undefined;
}
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({ children }: { children: ReactNode }) {
  useEffect(() => acquireScrollLock(), []);
  return (
    <DialogPrimitive.Portal
      container={typeof document === 'undefined' ? undefined : overlayRoot()}
    >
      <DialogPrimitive.Overlay className="ui-dialog-backdrop" />
      <DialogPrimitive.Content className="ui-dialog-content">
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;
export function AlertDialogContent({ children }: { children: ReactNode }) {
  useEffect(() => acquireScrollLock(), []);
  return (
    <AlertDialogPrimitive.Portal
      container={typeof document === 'undefined' ? undefined : overlayRoot()}
    >
      <AlertDialogPrimitive.Overlay className="ui-dialog-backdrop" />
      <AlertDialogPrimitive.Content className="ui-dialog-content">
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}
export function AlertDialogConfirm({
  children,
  onConfirm,
}: {
  children: ReactNode;
  onConfirm: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const confirm = async () => {
    if (pending) return;
    setPending(true);
    setFailed(false);
    try {
      await onConfirm();
    } catch {
      setFailed(true);
      setPending(false);
    }
  };
  return (
    <>
      <button
        type="button"
        className="ui-button"
        data-variant="danger"
        disabled={pending}
        aria-busy={pending || undefined}
        onClick={confirm}
      >
        {pending ? 'Working…' : children}
      </button>
      {failed ? (
        <p role="alert">Unable to complete the action. Please try again.</p>
      ) : null}
    </>
  );
}
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuItem = DropdownPrimitive.Item;
export function DropdownMenuContent({ children }: { children: ReactNode }) {
  return (
    <DropdownPrimitive.Portal
      container={typeof document === 'undefined' ? undefined : overlayRoot()}
    >
      <DropdownPrimitive.Content className="ui-dropdown">
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}
