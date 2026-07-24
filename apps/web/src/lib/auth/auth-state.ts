import type { PermissionKey } from '@/generated/permission-catalog';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  roles: readonly string[];
  permissions: ReadonlySet<PermissionKey>;
}
export type AuthenticationState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: CurrentUser }
  | { status: 'unauthenticated'; sessionEnded?: boolean }
  | { status: 'unauthorized' }
  | { status: 'error'; correlationId?: string };
