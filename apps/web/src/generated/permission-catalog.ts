// GENERATED from services/api/Proprium.Domain/Identity/PermissionCatalog.cs. Do not edit.
export const Permission = {
  AuthenticatedAccess: 'application.authenticated.access',
  AuthenticationEventRead: 'identity.authentication-event.read',
  PermissionRead: 'identity.permission.read',
  ProfileReadSelf: 'identity.profile.read-self',
  RoleAssignmentManage: 'identity.role-assignment.manage',
  RolePermissionManage: 'identity.role-permission.manage',
  RoleRead: 'identity.role.read',
  SessionManageSelf: 'identity.session.manage-self',
  UserManage: 'identity.user.manage',
  UserRead: 'identity.user.read',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

export const permissionValues: ReadonlySet<string> = new Set(
  Object.values(Permission),
);
