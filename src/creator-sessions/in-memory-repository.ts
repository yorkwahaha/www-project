import type {
  CreatorSessionLookupRow,
  CreatorSessionRepository,
  CreatorSessionRow,
  CreatorSessionUserRow,
} from './repository.js';

export type InMemoryCreatorSessionRepository = CreatorSessionRepository & {
  readonly sessions: Map<string, CreatorSessionRow>;
  seedUser(userId: string, status?: string): void;
  setUserStatus(userId: string, status: string): void;
};

export function createInMemoryCreatorSessionRepository(): InMemoryCreatorSessionRepository {
  const users = new Map<string, CreatorSessionUserRow>();
  const sessions = new Map<string, CreatorSessionRow>();

  return {
    sessions,

    seedUser(userId, status = 'active') {
      users.set(userId, { id: userId, status });
    },

    setUserStatus(userId, status) {
      const user = users.get(userId);
      if (user) {
        user.status = status;
      }
    },

    async findUserById(userId) {
      return users.get(userId) ?? null;
    },

    async insertSession(row) {
      sessions.set(row.token_sha256.toString('hex'), row);
    },

    async findSessionByDigest(tokenSha256): Promise<CreatorSessionLookupRow | null> {
      const session = sessions.get(tokenSha256.toString('hex'));
      if (!session) {
        return null;
      }
      const user = users.get(session.user_id);
      if (!user) {
        return null;
      }
      return { ...session, user_status: user.status };
    },

    async revokeSession(tokenSha256, revokedAt) {
      const session = sessions.get(tokenSha256.toString('hex'));
      if (!session || session.revoked_at !== null) {
        return false;
      }
      session.revoked_at = revokedAt;
      return true;
    },
  };
}
