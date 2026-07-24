import type { PermissionKey } from '@/generated/permission-catalog';
export function hasPermission(
  permissions: ReadonlySet<PermissionKey>,
  permission: PermissionKey,
): boolean {
  return permissions.has(permission);
}
export function hasAnyPermission(
  permissions: ReadonlySet<PermissionKey>,
  required: readonly PermissionKey[],
): boolean {
  return required.some((permission) => permissions.has(permission));
}
export function hasAllPermissions(
  permissions: ReadonlySet<PermissionKey>,
  required: readonly PermissionKey[],
): boolean {
  return required.every((permission) => permissions.has(permission));
}
