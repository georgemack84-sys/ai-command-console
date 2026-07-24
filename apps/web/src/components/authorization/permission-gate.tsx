'use client';
import type { PermissionKey } from '@/generated/permission-catalog';
import { useAuthentication } from '@/lib/auth/auth-context';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '@/lib/authorization/permission-checks';
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: React.PropsWithChildren<{
  permission?: PermissionKey;
  anyOf?: readonly PermissionKey[];
  allOf?: readonly PermissionKey[];
  fallback?: React.ReactNode;
}>) {
  const { state } = useAuthentication();
  if (state.status !== 'authenticated') return <>{fallback}</>;
  const granted =
    (permission ? hasPermission(state.user.permissions, permission) : true) &&
    (anyOf ? hasAnyPermission(state.user.permissions, anyOf) : true) &&
    (allOf ? hasAllPermissions(state.user.permissions, allOf) : true);
  return <>{granted ? children : fallback}</>;
}
