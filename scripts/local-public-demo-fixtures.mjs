import { createHash } from 'node:crypto';

/** Local demo fixtures — fake IDs only; never use in production. */
export const LOCAL_DEMO_VOTER_ID = '44444444-4444-4444-8444-444444444444';
export const LOCAL_DEMO_VOTER_B_ID = '55555555-5555-5555-8555-555555555555';
export const LOCAL_DEMO_READ_ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const LOCAL_DEMO_READ_TOKEN = 'FAKE-LOCAL-READ-TOKEN-DO-NOT-USE';

export function localDemoAdminCredentialsJson() {
  return JSON.stringify([
    {
      token_sha256: createHash('sha256')
        .update(LOCAL_DEMO_READ_TOKEN, 'utf8')
        .digest('hex'),
      admin_user_id: LOCAL_DEMO_READ_ADMIN_ID,
      role: 'admin',
      permissions: ['correction:read'],
    },
  ]);
}

/**
 * Upsert minimum users for manual public MVP demo (official voters + admin row).
 * Does not truncate polls — safe to run before npm start / demo:public:local.
 */
export async function seedLocalPublicDemoData(client) {
  await client.query(
    `INSERT INTO users (id, display_name, trust_level, status)
     VALUES ($1, 'Local Demo Voter A', 'official', 'active'),
            ($2, 'Local Demo Voter B', 'official', 'active'),
            ($3, 'Local Demo Read Admin', 'low', 'active')
     ON CONFLICT (id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       trust_level = EXCLUDED.trust_level,
       status = EXCLUDED.status`,
    [LOCAL_DEMO_VOTER_ID, LOCAL_DEMO_VOTER_B_ID, LOCAL_DEMO_READ_ADMIN_ID],
  );
  await client.query(
    `INSERT INTO admin_users (user_id, role, status)
     VALUES ($1, 'admin', 'active')
     ON CONFLICT (user_id) DO UPDATE SET
       role = EXCLUDED.role,
       status = EXCLUDED.status`,
    [LOCAL_DEMO_READ_ADMIN_ID],
  );
}
