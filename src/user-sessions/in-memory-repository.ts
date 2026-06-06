import type {
  UserSessionLookupRow,
  UserSessionRepository,
  UserSessionRow,
  UserSessionUserRow,
} from './repository.js';

export type InMemoryUserSessionRepository = UserSessionRepository & {
  readonly sessions: Map<string, UserSessionRow>;
  seedUser(userId: string, status?: string): void;
  setUserStatus(userId: string, status: string): void;
};

export function createInMemoryUserSessionRepository(): InMemoryUserSessionRepository {
  const users = new Map<string, UserSessionUserRow>();
  const sessions = new Map<string, UserSessionRow>();

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
      sessions.set(row.token_sha256.toString('hex'), { ...row });
    },

    async findSessionByDigest(
      tokenSha256,
    ): Promise<UserSessionLookupRow | null> {
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

    async markSessionUsed(sessionId, lastUsedAt) {
      const session = findSessionById(sessions, sessionId);
      if (
        !session ||
        session.revoked_at !== null ||
        session.expires_at.getTime() <= lastUsedAt.getTime()
      ) {
        return false;
      }
      session.last_used_at = lastUsedAt;
      return true;
    },

    async revokeSession(sessionId, revokedAt) {
      const session = findSessionById(sessions, sessionId);
      if (!session || session.revoked_at !== null) {
        return false;
      }
      session.revoked_at = revokedAt;
      return true;
    },
  };
}

function findSessionById(
  sessions: Map<string, UserSessionRow>,
  sessionId: string,
): UserSessionRow | null {
  for (const session of sessions.values()) {
    if (session.session_id === sessionId) {
      return session;
    }
  }
  return null;
}
