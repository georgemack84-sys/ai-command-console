import {
  permissionValues,
  type PermissionKey,
} from '@/generated/permission-catalog';
import { apiRequest, emptyResponse } from '@/lib/api/api-client';

import type { CurrentUser } from './auth-state';

export function parseCurrentUser(payload: unknown): CurrentUser {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw new Error('Invalid identity');
  const value = payload as Record<string, unknown>;
  const id = value.id ?? value.userId;
  if (
    typeof id !== 'string' ||
    typeof value.username !== 'string' ||
    typeof value.displayName !== 'string' ||
    !Array.isArray(value.permissions) ||
    !value.permissions.every((item) => typeof item === 'string')
  )
    throw new Error('Invalid identity');
  const roles =
    Array.isArray(value.roles) &&
    value.roles.every((item) => typeof item === 'string')
      ? value.roles
      : [];
  const permissions = new Set<PermissionKey>();
  for (const permission of value.permissions)
    if (isPermissionKey(permission)) permissions.add(permission);
  return {
    id,
    username: value.username,
    displayName: value.displayName,
    roles,
    permissions,
  };
}

function isPermissionKey(value: string): value is PermissionKey {
  return permissionValues.has(value);
}

export function getCurrentUser(signal?: AbortSignal) {
  return apiRequest({
    path: '/api/v1/auth/me',
    signal,
    parse: parseCurrentUser,
  });
}
export async function login(username: string, password: string) {
  const result = await apiRequest({
    path: '/api/v1/auth/login',
    method: 'POST',
    body: { username, password },
    parse: () => emptyResponse,
  });
  if (result !== emptyResponse) throw new Error('Login response must be empty');
}
export async function endSession() {
  const result = await apiRequest({
    path: '/api/v1/auth/logout',
    method: 'POST',
    parse: () => emptyResponse,
  });
  if (result !== emptyResponse)
    throw new Error('Logout response must be empty');
}
