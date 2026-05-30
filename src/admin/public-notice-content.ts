export const SUSPENDED_CORRECTION_NOTICE_TYPE = 'suspended_typo_correction_applied' as const;

export type SuspendedCorrectionPublicNoticeContent = {
  notice_type: typeof SUSPENDED_CORRECTION_NOTICE_TYPE;
  title: string;
  body: string;
};

/** Fixed public-safe notice text for Suspended × Correction apply (spec §19). */
export function buildSuspendedCorrectionPublicNotice(
  appliedAt: Date,
): SuspendedCorrectionPublicNoticeContent {
  const appliedAtIso = appliedAt.toISOString();
  return {
    notice_type: SUSPENDED_CORRECTION_NOTICE_TYPE,
    title: 'Poll typo correction applied',
    body: [
      'Poll was previously suspended.',
      'Admin typo correction was applied.',
      'Correction did not change semantic direction.',
      `Correction apply time: ${appliedAtIso}.`,
    ].join('\n'),
  };
}
