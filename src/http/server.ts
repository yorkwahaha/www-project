import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { getHealthStatus } from '../milestone.js';
import type { PollService } from '../polls/service.js';
import type { PublicFeedQuery } from '../polls/types.js';
import type { PublicNoticeService } from '../public-notices/service.js';
import { sendJson } from './json.js';
import { createAdminRouteHandlers, type AdminCorrectionServices } from './admin-routes.js';
import type { AdminAuth } from './admin-auth.js';
import {
  createCreatorSessionRouteHandlers,
} from './creator-session-routes.js';
import { createCreatorPollRouteHandlers } from './creator-poll-routes.js';
import { handleAdminRouteError } from './admin-error.js';
import { createPollRouteHandlers } from './poll-routes.js';
import { createPublicNoticeRouteHandlers } from './public-notice-routes.js';
import {
  createDefaultTestUserAuthResolver,
  type UserAuthResolver,
} from '../auth/user-auth-resolver.js';
import { createUserProfileRouteHandlers } from './user-profile-routes.js';
import type { CreatorSessionConfig } from '../creator-sessions/config.js';
import type { CreatorSessionService } from '../creator-sessions/service.js';
import {
  createLoginSessionRouteHandlers,
  type LoginSessionRouteOptions,
} from './login-session-routes.js';
import {
  createRegistrationRouteHandlers,
  type RegistrationRouteOptions,
} from './registration-routes.js';

export type { AdminCorrectionServices } from './admin-routes.js';

const POLL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Demo slug for public HTML vote/result pages only (not poll APIs). */
const PUBLIC_MVP_DEMO_POLL_SLUG = 'demo';

function isPublicMvpPagePollId(pollId: string): boolean {
  return POLL_ID_PATTERN.test(pollId) || pollId === PUBLIC_MVP_DEMO_POLL_SLUG;
}

export type HttpServerOptions = {
  pollService: PollService;
  userAuthResolver?: UserAuthResolver;
  adminCorrection?: AdminCorrectionServices;
  adminAuth?: AdminAuth;
  publicNoticeService?: PublicNoticeService;
  creatorSession?: {
    service: CreatorSessionService;
    config: CreatorSessionConfig;
  };
  loginSession?: LoginSessionRouteOptions;
  registration?: RegistrationRouteOptions;
};

export function createHttpServer(options: HttpServerOptions) {
  if ((options.adminCorrection === undefined) !== (options.adminAuth === undefined)) {
    throw new Error('adminCorrection and adminAuth must be configured together');
  }
  const userAuthResolver =
    options.userAuthResolver ?? createDefaultTestUserAuthResolver();
  const pollRoutes = createPollRouteHandlers(options.pollService, userAuthResolver);
  const userProfileRoutes = createUserProfileRouteHandlers(
    options.pollService,
    userAuthResolver,
  );
  const adminRoutes = options.adminCorrection && options.adminAuth
    ? createAdminRouteHandlers(options.adminCorrection, options.adminAuth)
    : null;
  const publicNoticeRoutes = options.publicNoticeService
    ? createPublicNoticeRouteHandlers(options.publicNoticeService)
    : null;
  const creatorSessionRoutes = options.creatorSession
    ? createCreatorSessionRouteHandlers(
        options.creatorSession.service,
        options.creatorSession.config,
        userAuthResolver,
      )
    : null;
  const creatorPollRoutes = options.creatorSession
    ? createCreatorPollRouteHandlers(
        options.pollService,
        options.creatorSession.service,
        options.creatorSession.config,
        userAuthResolver,
      )
    : null;
  const loginSessionRoutes = options.loginSession
    ? createLoginSessionRouteHandlers(options.loginSession)
    : null;
  const registrationRoutes = options.registration
    ? createRegistrationRouteHandlers(options.registration)
    : null;

  return createServer(async (req, res) => {
    try {
      await routeRequest(
        req,
        res,
        pollRoutes,
        userProfileRoutes,
        adminRoutes,
        options.adminAuth ?? null,
        publicNoticeRoutes,
        creatorSessionRoutes,
        creatorPollRoutes,
        loginSessionRoutes,
        registrationRoutes,
      );
    } catch {
      sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
    }
  });
}

async function routeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  pollRoutes: ReturnType<typeof createPollRouteHandlers>,
  userProfileRoutes: ReturnType<typeof createUserProfileRouteHandlers>,
  adminRoutes: ReturnType<typeof createAdminRouteHandlers> | null,
  adminAuth: AdminAuth | null,
  publicNoticeRoutes: ReturnType<typeof createPublicNoticeRouteHandlers> | null,
  creatorSessionRoutes: ReturnType<typeof createCreatorSessionRouteHandlers> | null,
  creatorPollRoutes: ReturnType<typeof createCreatorPollRouteHandlers> | null,
  loginSessionRoutes: ReturnType<typeof createLoginSessionRouteHandlers> | null,
  registrationRoutes: ReturnType<typeof createRegistrationRouteHandlers> | null,
): Promise<void> {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;

  if (method === 'GET' && path === '/health') {
    sendJson(res, 200, getHealthStatus());
    return;
  }

  if (path === '/login/session') {
    if (!loginSessionRoutes) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    if (method === 'POST') {
      await loginSessionRoutes.handlePostSession(req, res);
      return;
    }
    if (method === 'DELETE') {
      await loginSessionRoutes.handleDeleteSession(req, res);
      return;
    }
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return;
  }

  if (path === '/registration') {
    if (!registrationRoutes) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    if (method === 'POST') {
      await registrationRoutes.handlePostRegistration(req, res);
      return;
    }
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return;
  }

  if (path === '/users/me') {
    if (method === 'GET') {
      await userProfileRoutes.handleGetMe(req, res);
      return;
    }
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return;
  }

  if (path === '/users/me/profile') {
    if (method === 'GET') {
      await userProfileRoutes.handleGetProfile(req, res);
      return;
    }
    if (method === 'PUT') {
      await userProfileRoutes.handlePutProfile(req, res);
      return;
    }
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return;
  }

  if (path === '/creator/session') {
    if (!creatorSessionRoutes) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    if (method === 'POST') {
      await creatorSessionRoutes.handlePostSession(req, res);
      return;
    }
    if (method === 'GET') {
      await creatorSessionRoutes.handleGetSession(req, res);
      return;
    }
    if (method === 'DELETE') {
      await creatorSessionRoutes.handleDeleteSession(req, res);
      return;
    }
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return;
  }

  if (path === '/creator/polls') {
    if (!creatorPollRoutes) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    if (method === 'POST') {
      await creatorPollRoutes.handlePostCreatorPolls(req, res);
      return;
    }
    if (method === 'GET') {
      await creatorPollRoutes.handleGetCreatorPolls(req, res);
      return;
    }
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return;
  }

  const creatorPollMatch = path.match(
    /^\/creator\/polls\/([^/]+)(?:\/(cancel|close|unpublish))?$/,
  );
  if (creatorPollMatch) {
    if (!creatorPollRoutes) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    const pollId = creatorPollMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    const transition = creatorPollMatch[2];
    if (method === 'DELETE' && transition === undefined) {
      await creatorPollRoutes.handleDeleteCreatorPoll(req, res, pollId);
      return;
    }
    if (method === 'POST' && transition === 'cancel') {
      await creatorPollRoutes.handlePostCancelCreatorPoll(req, res, pollId);
      return;
    }
    if (method === 'POST' && transition === 'close') {
      await creatorPollRoutes.handlePostCloseCreatorPoll(req, res, pollId);
      return;
    }
    if (method === 'POST' && transition === 'unpublish') {
      await creatorPollRoutes.handlePostUnpublishCreatorPoll(req, res, pollId);
      return;
    }
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return;
  }

  if (method === 'GET' && path === '/') {
    await sendPublicFile(res, 'index.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/frontend/public-mvp.css') {
    await sendPublicFile(
      res,
      'frontend/public-mvp.css',
      'text/css; charset=utf-8',
    );
    return;
  }

  if (method === 'GET' && path === '/frontend/public-mvp-ui.js') {
    await sendPublicFile(
      res,
      'frontend/public-mvp-ui.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  if (method === 'GET' && path === '/frontend/public-mvp-layout.js') {
    await sendPublicFile(
      res,
      'frontend/public-mvp-layout.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  if (method === 'GET' && path === '/frontend/public-mvp-demo.js') {
    await sendPublicFile(
      res,
      'frontend/public-mvp-demo.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  if (method === 'GET' && path === '/frontend/policy-ui-placeholders.js') {
    await sendPublicFile(
      res,
      'frontend/policy-ui-placeholders.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  if (method === 'GET' && path === '/frontend/result-page.js') {
    await sendPublicFile(res, 'frontend/result-page.js', 'text/javascript; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/frontend/submission-privacy.js') {
    await sendPublicFile(
      res,
      'frontend/submission-privacy.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  const resultPageMatch = path.match(/^\/results\/([^/]+)$/);
  if (resultPageMatch && method === 'GET') {
    const pollId = resultPageMatch[1]!;
    if (!isPublicMvpPagePollId(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    await sendPublicFile(res, 'results.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'PUT' || method === 'PATCH') {
    if (path === '/polls' || path.startsWith('/polls/')) {
      sendJson(res, 405, {
        error: 'METHOD_NOT_ALLOWED',
        message: 'Poll content cannot be edited after publish',
      });
      return;
    }
  }

  if (path === '/polls' && method === 'POST') {
    await pollRoutes.handlePostPolls(req, res);
    return;
  }

  if (path === '/polls/feed' && method === 'GET') {
    const feedQuery = parsePublicFeedQuery(url);
    if ('error' in feedQuery) {
      sendJson(res, 400, feedQuery.error);
      return;
    }
    await pollRoutes.handleGetPublicFeed(req, res, feedQuery.value);
    return;
  }

  const referenceAnswerMatch = path.match(/^\/polls\/([^/]+)\/reference-answer$/);
  if (referenceAnswerMatch && method === 'POST') {
    const pollId = referenceAnswerMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    await pollRoutes.handlePostReferenceAnswer(req, res, pollId);
    return;
  }

  const lifecycleTransitionMatch = path.match(
    /^\/polls\/([^/]+)\/(cancel|close|unpublish)$/,
  );
  if (lifecycleTransitionMatch && method === 'POST') {
    const pollId = lifecycleTransitionMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    const transition = lifecycleTransitionMatch[2];
    if (transition === 'cancel') {
      await pollRoutes.handlePostCancelPoll(req, res, pollId);
    } else if (transition === 'close') {
      await pollRoutes.handlePostClosePoll(req, res, pollId);
    } else {
      await pollRoutes.handlePostUnpublishPoll(req, res, pollId);
    }
    return;
  }

  const officialVoteMatch = path.match(/^\/polls\/([^/]+)\/vote$/);
  if (officialVoteMatch && method === 'POST') {
    const pollId = officialVoteMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    await pollRoutes.handlePostOfficialVote(req, res, pollId);
    return;
  }

  const officialVoteByIndexMatch = path.match(/^\/polls\/([^/]+)\/vote-by-index$/);
  if (officialVoteByIndexMatch && method === 'POST') {
    const pollId = officialVoteByIndexMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    await pollRoutes.handlePostOfficialVoteByIndex(req, res, pollId);
    return;
  }

  const resultMatch = path.match(/^\/polls\/([^/]+)\/results$/);
  if (resultMatch && method === 'GET') {
    const pollId = resultMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    await pollRoutes.handleGetPollResults(req, res, pollId);
    return;
  }

  const publicNoticesMatch = path.match(/^\/polls\/([^/]+)\/public-notices$/);
  if (publicNoticesMatch && method === 'GET') {
    const pollId = publicNoticesMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    if (!publicNoticeRoutes) {
      sendJson(res, 200, { notices: [] });
      return;
    }
    await publicNoticeRoutes.handleGetPollPublicNotices(req, res, pollId);
    return;
  }

  if (method === 'GET' && path === '/frontend/create-poll-page.js') {
    await sendPublicFile(
      res,
      'frontend/create-poll-page.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  if (method === 'GET' && path === '/frontend/vote-page.js') {
    await sendPublicFile(res, 'frontend/vote-page.js', 'text/javascript; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/frontend/profile-page.js') {
    await sendPublicFile(res, 'frontend/profile-page.js', 'text/javascript; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/polls/new') {
    await sendPublicFile(res, 'create-poll.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/profile') {
    await sendPublicFile(res, 'profile.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/login') {
    await sendPublicFile(res, 'login.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/frontend/login-page.js') {
    await sendPublicFile(res, 'frontend/login-page.js', 'text/javascript; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/explore') {
    await sendPublicFile(res, 'explore.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/faq') {
    await sendPublicFile(res, 'faq.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/trust-levels') {
    await sendPublicFile(res, 'trust-levels.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/my-polls') {
    await sendPublicFile(res, 'my-polls.html', 'text/html; charset=utf-8');
    return;
  }

  if (method === 'GET' && path === '/frontend/my-polls-page.js') {
    await sendPublicFile(
      res,
      'frontend/my-polls-page.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  if (method === 'GET' && path === '/frontend/explore-page.js') {
    await sendPublicFile(
      res,
      'frontend/explore-page.js',
      'text/javascript; charset=utf-8',
    );
    return;
  }

  const votePageMatch = path.match(/^\/vote\/([^/]+)$/);
  if (votePageMatch && method === 'GET') {
    const pollId = votePageMatch[1]!;
    if (!isPublicMvpPagePollId(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    await sendPublicFile(res, 'vote.html', 'text/html; charset=utf-8');
    return;
  }

  const pollMatch = path.match(/^\/polls\/([^/]+)$/);
  if (pollMatch) {
    const pollId = pollMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    if (method === 'GET') {
      await pollRoutes.handleGetPoll(req, res, pollId);
      return;
    }
    if (method === 'DELETE') {
      await pollRoutes.handleDeletePoll(req, res, pollId);
      return;
    }
  }

  if (path.startsWith('/admin/')) {
    if (!adminRoutes || !adminAuth) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    let principal;
    try {
      principal = adminAuth.authenticate(req);
    } catch (err) {
      handleAdminRouteError(res, err);
      return;
    }
    if (path === '/admin/correction-requests' && method === 'POST') {
      await adminRoutes.handlePostCorrectionRequests(req, res, principal);
      return;
    }

    if (path === '/admin/suspended-correction-requests' && method === 'POST') {
      await adminRoutes.handlePostSuspendedCorrectionRequests(req, res, principal);
      return;
    }

    if (path === '/admin/correction-audit' && method === 'GET') {
      await adminRoutes.handleGetGlobalCorrectionAudit(req, res, url.searchParams, principal);
      return;
    }

    const pollCorrectionAuditMatch = path.match(
      /^\/admin\/polls\/([^/]+)\/correction-audit$/,
    );
    if (pollCorrectionAuditMatch && method === 'GET') {
      const pollId = pollCorrectionAuditMatch[1]!;
      if (!POLL_ID_PATTERN.test(pollId)) {
        sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
        return;
      }
      await adminRoutes.handleGetPollCorrectionAudit(
        req,
        res,
        pollId,
        url.searchParams,
        principal,
      );
      return;
    }

    const suspendedApplyMatch = path.match(
      /^\/admin\/suspended-correction-requests\/([^/]+)\/apply$/,
    );
    if (suspendedApplyMatch && method === 'POST') {
      const requestId = suspendedApplyMatch[1]!;
      if (!POLL_ID_PATTERN.test(requestId)) {
        sendJson(res, 400, {
          error: 'INVALID_REQUEST_ID',
          message: 'Invalid request id',
        });
        return;
      }
      await adminRoutes.handlePostSuspendedCorrectionApply(req, res, requestId, principal);
      return;
    }

    const correctionRequestMatch = path.match(
      /^\/admin\/correction-requests\/([^/]+)\/(review-context|audit-record|decisions|apply)$/,
    );
    if (correctionRequestMatch) {
      const requestId = correctionRequestMatch[1]!;
      const subPath = correctionRequestMatch[2];
      if (!POLL_ID_PATTERN.test(requestId)) {
        sendJson(res, 400, {
          error: 'INVALID_REQUEST_ID',
          message: 'Invalid request id',
        });
        return;
      }
      if (subPath === 'review-context' && method === 'GET') {
        await adminRoutes.handleGetReviewContext(req, res, requestId, principal);
        return;
      }
      if (subPath === 'audit-record' && method === 'GET') {
        await adminRoutes.handleGetAuditRecord(req, res, requestId, principal);
        return;
      }
      if (subPath === 'decisions' && method === 'POST') {
        await adminRoutes.handlePostCorrectionDecision(req, res, requestId, principal);
        return;
      }
      if (subPath === 'apply' && method === 'POST') {
        await adminRoutes.handlePostCorrectionApply(req, res, requestId, principal);
        return;
      }
    }

    sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
    return;
  }

  sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
}

async function sendPublicFile(
  res: ServerResponse,
  relativePath: string,
  contentType: string,
): Promise<void> {
  const body = await readFile(new URL(`../../public/${relativePath}`, import.meta.url), 'utf8');
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'",
  });
  res.end(body);
}

const FEED_QUERY_PARAM_ALLOWLIST = new Set(['limit', 'cursor']);

function parsePublicFeedQuery(
  url: URL,
): { value: PublicFeedQuery } | { error: { error: string; message: string } } {
  for (const key of url.searchParams.keys()) {
    if (!FEED_QUERY_PARAM_ALLOWLIST.has(key)) {
      return {
        error: {
          error: 'UNSUPPORTED_QUERY_PARAMS',
          message: 'Feed query parameters are not supported',
        },
      };
    }
  }

  const limit = url.searchParams.get('limit');
  const cursor = url.searchParams.get('cursor');
  return {
    value: {
      ...(limit === null ? {} : { limit }),
      ...(cursor === null ? {} : { cursor }),
    },
  };
}
