import {
  permissionValues,
  type PermissionKey,
} from '@/generated/permission-catalog';
import { apiRequest, emptyResponse } from '@/lib/api/api-client';

import type { CurrentUser } from './auth-state';

export interface RecoveryContact {
  maskedEmail: string | null;
  isVerified: boolean;
  verificationPending: boolean;
}

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

export function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  return apiRequest({
    path: '/api/v1/auth/me',
    signal,
    parse: parseCurrentUser,
  });
}

export function updateCurrentUserProfile(
  displayName: string,
): Promise<CurrentUser> {
  return apiRequest({
    path: '/api/v1/auth/me',
    method: 'PATCH',
    body: { displayName },
    parse: parseCurrentUser,
  });
}

function parseRecoveryContact(payload: unknown): RecoveryContact {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw new Error('Invalid recovery contact');
  const value = payload as Record<string, unknown>;
  if (
    (typeof value.maskedEmail !== 'string' && value.maskedEmail !== null) ||
    typeof value.isVerified !== 'boolean' ||
    typeof value.verificationPending !== 'boolean'
  )
    throw new Error('Invalid recovery contact');
  return {
    maskedEmail: value.maskedEmail,
    isVerified: value.isVerified,
    verificationPending: value.verificationPending,
  };
}

export function getRecoveryContact(): Promise<RecoveryContact> {
  return apiRequest({
    path: '/api/v1/auth/recovery-contact',
    parse: parseRecoveryContact,
  });
}

export async function beginRecoveryContactVerification(
  email: string,
  currentPassword: string,
): Promise<void> {
  const result = await apiRequest({
    path: '/api/v1/auth/recovery-contact',
    method: 'POST',
    body: { email, currentPassword },
    parse: () => emptyResponse,
  });
  if (result !== emptyResponse)
    throw new Error('Recovery-contact response must be empty');
}

export async function completeRecoveryContactVerification(
  token: string,
): Promise<void> {
  const result = await apiRequest({
    path: '/api/v1/auth/recovery-contact/verify',
    method: 'POST',
    body: { token },
    parse: () => emptyResponse,
  });
  if (result !== emptyResponse)
    throw new Error('Recovery-contact response must be empty');
}
export async function login(username: string, password: string): Promise<void> {
  const result = await apiRequest({
    path: '/api/v1/auth/login',
    method: 'POST',
    body: { username, password },
    parse: () => emptyResponse,
  });
  if (result !== emptyResponse) throw new Error('Login response must be empty');
}
export async function registerAccount(
  username: string,
  displayName: string,
  password: string,
): Promise<void> {
  const result = await apiRequest({
    path: '/api/v1/auth/register',
    method: 'POST',
    body: { username, displayName, password },
    parse: () => emptyResponse,
  });
  if (result !== emptyResponse)
    throw new Error('Registration response must be empty');
}
export async function endSession(): Promise<void> {
  const result = await apiRequest({
    path: '/api/v1/auth/logout',
    method: 'POST',
    parse: () => emptyResponse,
  });
  if (result !== emptyResponse)
    throw new Error('Logout response must be empty');
}
