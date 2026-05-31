import {
  createAdminAuth,
  sha256AdminToken,
  type AdminPermission,
} from '../../src/http/admin-auth.js';

export const FULL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'correction:read',
  'correction:write',
];

export function adminAuthHeaders(adminId: string) {
  return { Authorization: `Bearer ${adminTokenFor(adminId)}` };
}

export function createTestAdminAuth(
  entries: Array<{
    adminId: string;
    permissions?: AdminPermission[];
  }>,
) {
  return createAdminAuth(
    entries.map(({ adminId, permissions = FULL_ADMIN_PERMISSIONS }) => ({
      token_sha256: sha256AdminToken(adminTokenFor(adminId)),
      admin_user_id: adminId,
      role: 'admin',
      permissions,
    })),
  );
}

function adminTokenFor(adminId: string): string {
  return `test-admin-token:${adminId}`;
}
