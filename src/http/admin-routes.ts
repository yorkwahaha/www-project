import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CorrectionService } from '../admin/correction-service.js';
import type { CorrectionApplyService } from '../admin/correction-apply-service.js';
import type { CorrectionDecisionService } from '../admin/correction-decision-service.js';
import type { SuspendedCorrectionApplyService } from '../admin/suspended-correction-apply-service.js';
import type { SuspendedCorrectionService } from '../admin/suspended-correction-service.js';
import {
  CORRECTION_TARGET_FIELDS,
  type AdminDecisionValue,
  type CorrectionReviewContext,
  type CorrectionTargetField,
} from '../admin/types.js';
import { requireAdminUserId } from './admin-auth.js';
import { AdminRouteError, handleAdminRouteError } from './admin-error.js';
import { readJsonBody, sendJson } from './json.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminCorrectionServices = {
  correctionService: CorrectionService;
  decisionService: CorrectionDecisionService;
  applyService: CorrectionApplyService;
  suspendedCorrectionService: SuspendedCorrectionService;
  suspendedApplyService: SuspendedCorrectionApplyService;
};

type CreateCorrectionRequestBody = {
  poll_id?: string;
  correction_target_field?: string;
  correction_target_id?: string | null;
  proposed_text?: string;
  reason?: string;
};

export type CreateCorrectionRequestResponse = {
  request_id: string;
  status: 'pending';
  requires_dual_admin: boolean;
  valid_until: string;
};

export type CreateSuspendedCorrectionRequestResponse = {
  request_id: string;
  status: 'pending';
  requires_dual_admin: boolean;
  valid_until: string;
  poll_status: 'correction_pending';
};

export type ApplySuspendedCorrectionRequestResponse = {
  request_id: string;
  status: 'applied';
  poll_status: 'active';
  correction_log_id: string;
  public_notice_id: string;
};

type SubmitCorrectionDecisionBody = {
  decision?: string;
  reason_code?: string;
  reason_text?: string;
};

export type SubmitCorrectionDecisionResponse = {
  request_id: string;
  request_status: string;
  decision_id: string;
};

export type ApplyCorrectionRequestResponse = {
  request_id: string;
  status: 'applied';
  correction_log_id: string;
};

export function createAdminRouteHandlers(services: AdminCorrectionServices) {
  return {
    async handlePostCorrectionRequests(
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<void> {
      try {
        const adminUserId = requireAdminUserId(req);
        const body = await readJsonBody<CreateCorrectionRequestBody>(req);
        const input = parseCreateCorrectionRequestInput(body);

        const result = await services.correctionService.createCorrectionRequest({
          adminUserId,
          ...input,
        });

        const response: CreateCorrectionRequestResponse = {
          request_id: result.request_id,
          status: result.status,
          requires_dual_admin: result.requires_dual_admin,
          valid_until: result.valid_until,
        };
        sendJson(res, 201, response);
      } catch (err) {
        handleAdminRouteError(res, err);
      }
    },

    async handleGetReviewContext(
      req: IncomingMessage,
      res: ServerResponse,
      requestId: string,
    ): Promise<void> {
      try {
        requireRequestId(requestId);
        const adminUserId = requireAdminUserId(req);
        const context = await services.decisionService.getReviewContext(
          requestId,
          adminUserId,
        );
        sendJson(res, 200, toReviewContextResponse(context));
      } catch (err) {
        handleAdminRouteError(res, err);
      }
    },

    async handlePostCorrectionDecision(
      req: IncomingMessage,
      res: ServerResponse,
      requestId: string,
    ): Promise<void> {
      try {
        requireRequestId(requestId);
        const adminUserId = requireAdminUserId(req);
        const body = await readJsonBody<SubmitCorrectionDecisionBody>(req);
        const decision = parseDecision(body.decision);
        const reasonCode = body.reason_code?.trim() ?? '';
        if (!reasonCode) {
          throw new AdminRouteError('CORRECTION_VALIDATION', 'reason_code is required', 400);
        }

        const result = await services.decisionService.submitCorrectionDecision(
          requestId,
          adminUserId,
          {
            decision,
            reason_code: reasonCode,
            reason_text: body.reason_text,
          },
        );

        const response: SubmitCorrectionDecisionResponse = {
          request_id: result.request_id,
          request_status: result.request_status,
          decision_id: result.decision_id,
        };
        sendJson(res, 200, response);
      } catch (err) {
        handleAdminRouteError(res, err);
      }
    },

    async handlePostCorrectionApply(
      req: IncomingMessage,
      res: ServerResponse,
      requestId: string,
    ): Promise<void> {
      try {
        requireRequestId(requestId);
        const adminUserId = requireAdminUserId(req);
        const result = await services.applyService.applyCorrectionRequest(
          requestId,
          adminUserId,
        );

        const response: ApplyCorrectionRequestResponse = {
          request_id: result.request_id,
          status: 'applied',
          correction_log_id: result.correction_log_id,
        };
        sendJson(res, 200, response);
      } catch (err) {
        handleAdminRouteError(res, err);
      }
    },

    async handlePostSuspendedCorrectionRequests(
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<void> {
      try {
        const adminUserId = requireAdminUserId(req);
        const body = await readJsonBody<CreateCorrectionRequestBody>(req);
        const input = parseCreateCorrectionRequestInput(body);

        const result =
          await services.suspendedCorrectionService.createSuspendedCorrectionRequest({
            adminUserId,
            ...input,
          });

        const response: CreateSuspendedCorrectionRequestResponse = {
          request_id: result.request_id,
          status: result.status,
          requires_dual_admin: result.requires_dual_admin,
          valid_until: result.valid_until,
          poll_status: 'correction_pending',
        };
        sendJson(res, 201, response);
      } catch (err) {
        handleAdminRouteError(res, err);
      }
    },

    async handlePostSuspendedCorrectionApply(
      req: IncomingMessage,
      res: ServerResponse,
      requestId: string,
    ): Promise<void> {
      try {
        requireRequestId(requestId);
        const adminUserId = requireAdminUserId(req);
        const result = await services.suspendedApplyService.applySuspendedCorrectionRequest(
          requestId,
          adminUserId,
        );

        const response: ApplySuspendedCorrectionRequestResponse = {
          request_id: result.request_id,
          status: 'applied',
          poll_status: 'active',
          correction_log_id: result.correction_log_id,
          public_notice_id: result.public_notice_id,
        };
        sendJson(res, 200, response);
      } catch (err) {
        handleAdminRouteError(res, err);
      }
    },
  };
}

function parseCreateCorrectionRequestInput(body: CreateCorrectionRequestBody): {
  pollId: string;
  correctionTargetField: CorrectionTargetField;
  correctionTargetId?: string | null;
  proposedText: string;
  reason: string;
} {
  const pollId = body.poll_id?.trim() ?? '';
  if (!UUID_PATTERN.test(pollId)) {
    throw new AdminRouteError('INVALID_POLL_ID', 'Invalid poll id', 400);
  }

  return {
    pollId,
    correctionTargetField: parseCorrectionTargetField(body.correction_target_field),
    correctionTargetId: body.correction_target_id,
    proposedText: body.proposed_text ?? '',
    reason: body.reason ?? '',
  };
}

export function requireRequestId(requestId: string): void {
  if (!UUID_PATTERN.test(requestId)) {
    throw new AdminRouteError('INVALID_REQUEST_ID', 'Invalid request id', 400);
  }
}

function parseCorrectionTargetField(value: string | undefined): CorrectionTargetField {
  if (
    value === undefined ||
    !CORRECTION_TARGET_FIELDS.includes(value as CorrectionTargetField)
  ) {
    throw new AdminRouteError(
      'CORRECTION_VALIDATION',
      'correction_target_field must be title, description, or option_text',
      400,
    );
  }
  return value as CorrectionTargetField;
}

function parseDecision(value: string | undefined): AdminDecisionValue {
  if (value === 'approve' || value === 'reject') {
    return value;
  }
  throw new AdminRouteError(
    'CORRECTION_VALIDATION',
    'decision must be approve or reject',
    400,
  );
}

function toReviewContextResponse(
  context: CorrectionReviewContext,
): CorrectionReviewContext {
  return {
    request_id: context.request_id,
    poll_id: context.poll_id,
    request_status: context.request_status,
    poll_status: context.poll_status,
    correction_target_field: context.correction_target_field,
    correction_target_id: context.correction_target_id,
    original_text: context.original_text,
    proposed_text: context.proposed_text,
    requires_dual_admin: context.requires_dual_admin,
    valid_until: context.valid_until,
    viewer_has_submitted: context.viewer_has_submitted,
    peer_decisions: context.peer_decisions,
    final_decisions: context.final_decisions,
  };
}
