import { describe, expect, it } from 'vitest';

import { Permission } from '@/generated/permission-catalog';

import { parseCurrentUser } from './auth-service';

describe('parseCurrentUser', () => {
  it('drops unknown permissions and normalizes duplicates', () => {
    const user = parseCurrentUser({
      id: 'user-1',
      username: 'operator',
      displayName: 'Operator',
      roles: ['administrator'],
      permissions: [
        Permission.UserManage,
        'newer.backend.permission',
        Permission.UserManage,
      ],
    });
    expect([...user.permissions]).toEqual([Permission.UserManage]);
  });
  it('fails closed for malformed permission data', () => {
    expect(() =>
      parseCurrentUser({
        id: 'user-1',
        username: 'operator',
        displayName: 'Operator',
        permissions: ['valid', 1],
      }),
    ).toThrow('Invalid identity');
  });
});
