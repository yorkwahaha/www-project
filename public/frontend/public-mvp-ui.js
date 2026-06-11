/** Shared public MVP UI helpers with no durable storage. */

export const POLL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Demo slug allowed on public HTML routes only (not backend poll APIs). */
export const PUBLIC_MVP_DEMO_POLL_SLUG = 'demo';

export function isPublicMvpPagePollId(pollId) {
  return (
    POLL_ID_PATTERN.test(pollId) ||
    pollId === PUBLIC_MVP_DEMO_POLL_SLUG
  );
}

export const VOTE_PAGE_LOAD_FAILURE = '目前無法載入問卷，請稍後再試。';
export const VOTE_SUBMIT_TRANSPORT_FAILURE = '目前無法送出投票，請稍後再試。';
export const GENERIC_VOTE_SUBMIT_FAILURE =
  '目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。';

/** Frontend-owned vote route unavailable title. */
export const PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE = '無法開啟投票頁';

/** Frontend-owned vote route unavailable messages. */
export const PUBLIC_VOTE_ROUTE_MISSING_ID_MESSAGE =
  '網址缺少問卷識別碼，請從建立問卷頁取得正確的投票連結。';
export const PUBLIC_VOTE_ROUTE_INVALID_ID_MESSAGE =
  '網址中的問卷識別碼格式不正確，請確認連結是否完整。';

/** Frontend-owned poll load / vote-blocked unavailable messages. */
export const PUBLIC_POLL_INVALID_ID_MESSAGE =
  '網址中的問卷識別碼格式不正確。';
export const PUBLIC_POLL_NOT_FOUND_MESSAGE =
  '找不到此問卷，可能已刪除、尚未公開，或連結有誤。';
export const PUBLIC_POLL_ARCHIVED_MESSAGE = '此問卷已封存，無法查看。';
export const PUBLIC_VOTE_POLL_ENDED_MESSAGE = '此問卷已結束。';
export const PUBLIC_VOTE_POLL_CLOSED_MESSAGE = '此問卷已截止，無法再投票。';
export const PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE = '此問卷目前不接受投票。';
export const PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE = '此問卷目前無法使用。';
export const PUBLIC_POLL_INVALID_REQUEST_MESSAGE =
  '請求無效，請確認連結是否正確。';

/** Frontend-owned poll load / blocked messages safe to show from caught errors. */
export const PUBLIC_POLL_LOAD_USER_MESSAGES = [
  VOTE_PAGE_LOAD_FAILURE,
  PUBLIC_POLL_INVALID_ID_MESSAGE,
  PUBLIC_POLL_NOT_FOUND_MESSAGE,
  PUBLIC_POLL_ARCHIVED_MESSAGE,
  PUBLIC_VOTE_POLL_ENDED_MESSAGE,
  PUBLIC_VOTE_POLL_CLOSED_MESSAGE,
  PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE,
  PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE,
  PUBLIC_POLL_INVALID_REQUEST_MESSAGE,
];

/** Frontend-owned vote submit messages safe to show from caught errors. */
export const PUBLIC_VOTE_SUBMIT_USER_MESSAGES = [
  GENERIC_VOTE_SUBMIT_FAILURE,
  VOTE_SUBMIT_TRANSPORT_FAILURE,
];

/** Frontend-owned generic action pending copy (submit / transition / logout). */
export const PUBLIC_ACTION_PENDING_MESSAGE = '處理中，請稍候。';

/** Frontend-owned generic loading pending copy (initial page / region fetch). */
export const PUBLIC_LOADING_PENDING_MESSAGE = '載入中，請稍候。';

/** Allowlist of safe user-visible loading / pending messages across public surfaces. */
export const PUBLIC_PENDING_USER_MESSAGES = [
  PUBLIC_ACTION_PENDING_MESSAGE,
  PUBLIC_LOADING_PENDING_MESSAGE,
  '登入中，請稍候。',
  '註冊中，請稍候。',
  '儲存中，請稍候。',
  '送出中，請稍候。',
  '建立中，請稍候。',
  '登出中，請稍候。',
  '載入探索列表中，請稍候。',
  '載入更多中，請稍候。',
  '載入問卷中，請稍候。',
  '載入結果中，請稍候。',
  '載入你的問卷中，請稍候。',
  '載入個人資料提示中，請稍候。',
];

/** Frontend-owned login success copy. */
export const PUBLIC_LOGIN_SUCCESS_MESSAGE =
  '登入成功。頁首登入狀態已更新。';

/** Frontend-owned registration success copy. */
export const PUBLIC_REGISTRATION_SUCCESS_MESSAGE =
  '註冊成功。請前往登入頁完成登入；註冊不會自動登入。';

/** Frontend-owned profile save success copy. */
export const PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE = '個人資料已儲存。';

/** Frontend-owned live create-poll form success status copy. */
export const PUBLIC_CREATE_POLL_SUCCESS_MESSAGE = '問卷已建立。';

/** Frontend-owned demo create-poll form success status copy. */
export const PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE =
  '表單通過檢查（展示用），資料不會儲存。';

/** Frontend-owned demo create-poll success panel lead copy. */
export const PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD =
  '此流程展示未來的使用方式：表單已通過檢查，資料不會儲存。可繼續體驗下列頁面：';

/** Frontend-owned create-poll share panel lead copy. */
export const PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD =
  '問卷已建立。下方為可分享的完整網址（僅含問卷識別碼）。請將投票連結傳給參與者；結果連結為公開唯讀統計頁。收集中不顯示票數或百分比，發起者亦看不到中間結果。';

/** Frontend-owned vote success panel copy. */
export const PUBLIC_VOTE_SUCCESS_MESSAGE = '投票已送出，感謝參與。';

/** Frontend-owned vote success form status copy. */
export const PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE = '投票已送出。';

/** Frontend-owned demo vote success status copy. */
export const PUBLIC_VOTE_DEMO_SUCCESS_STATUS_MESSAGE =
  '投票流程已展示（不會儲存）。';

/** Frontend-owned demo vote success panel copy. */
export const PUBLIC_VOTE_DEMO_SUCCESS_MESSAGE =
  '此流程展示未來的使用方式，投票不會儲存。';

/** Frontend-owned vote success result-page hint copy. */
export const PUBLIC_VOTE_SUCCESS_RESULT_HINT =
  '收集中結果頁不顯示票數或百分比。結果公開後可查看彙總統計：';

/** Frontend-owned demo vote success result-page hint copy. */
export const PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT =
  '收集中結果頁不顯示票數或百分比。可前往結果頁查看收集中說明：';

/** Frontend-owned lifecycle cancel success copy. */
export const PUBLIC_LIFECYCLE_CANCEL_SUCCESS_MESSAGE =
  '問卷已取消，不會產生公開結果。';

/** Frontend-owned lifecycle close success copy. */
export const PUBLIC_LIFECYCLE_CLOSE_SUCCESS_MESSAGE =
  '問卷已公開結果，進入公開鎖定期。';

/** Frontend-owned lifecycle unpublish success copy. */
export const PUBLIC_LIFECYCLE_UNPUBLISH_SUCCESS_MESSAGE = '問卷已下架。';

/** Frontend-owned lifecycle success when result refresh is deferred. */
export const PUBLIC_LIFECYCLE_REFRESH_DEFERRED_SUCCESS_MESSAGE =
  '狀態已更新。結果顯示暫時無法重新載入，請重新整理頁面。';

/** Frontend-owned share-link copy success copy. */
export const PUBLIC_SHARE_LINK_COPIED_MESSAGE = '已複製連結。';

/** Frontend-owned share-link manual prompt copy. */
export const PUBLIC_SHARE_LINK_PROMPT_MESSAGE =
  '瀏覽器無法自動複製，已顯示手動複製提示；亦可選取上方完整網址。';

/** Frontend-owned share-link manual fallback copy. */
export const PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE =
  '無法自動複製，請手動選取上方完整網址。';

/** Allowlist of safe user-visible success / completion messages across public surfaces. */
export const PUBLIC_SUCCESS_USER_MESSAGES = [
  PUBLIC_LOGIN_SUCCESS_MESSAGE,
  PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
  PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD,
  PUBLIC_VOTE_SUCCESS_MESSAGE,
  PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE,
  PUBLIC_VOTE_DEMO_SUCCESS_STATUS_MESSAGE,
  PUBLIC_VOTE_DEMO_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_CANCEL_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_CLOSE_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISH_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_REFRESH_DEFERRED_SUCCESS_MESSAGE,
  PUBLIC_SHARE_LINK_COPIED_MESSAGE,
  PUBLIC_SHARE_LINK_PROMPT_MESSAGE,
  PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE,
  '問卷已建立。請先複製並分享「投票連結」給參與者；收集中不顯示票數或百分比。',
  '可在下方變更問卷狀態，或前往「我的問卷」與「結果頁（發起者）」繼續管理。',
  PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD,
  PUBLIC_VOTE_SUCCESS_RESULT_HINT,
  PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT,
];

/** Frontend-owned neutral pre-vote hints when submit may be unavailable. */
export const PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT =
  '正式投票可能需要登入。若你尚未登入，可前往登入頁完成登入後再嘗試投票。';
export const PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT =
  '部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。若你尚未填寫，可至個人資料頁補充或更新；此提示不代表一定可以完成投票。';
export const PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT =
  '送出投票後，系統會依該投票的規則在當下判定是否可計票。此提示不代表一定可以完成投票。';

/** Frontend-owned results unavailable / non-aggregate copy. */
export const PUBLIC_RESULTS_COLLECTING_TITLE = '結果尚未公開';
export const PUBLIC_RESULTS_COLLECTING_SUMMARY =
  '本問卷仍在收集中。此頁不顯示總票數、選項票數、百分比、排名或趨勢。';
export const PUBLIC_RESULTS_CANCELLED_TITLE = '問卷已取消';
export const PUBLIC_RESULTS_CANCELLED_MESSAGE =
  '此問卷已取消，不會產生可公開顯示的聚合結果。';
export const PUBLIC_RESULTS_UNPUBLISHED_TITLE = '問卷目前無法查看';
export const PUBLIC_RESULTS_UNPUBLISHED_MESSAGE =
  '此問卷目前無法查看，頁面不顯示聚合結果。';
export const PUBLIC_RESULTS_POLL_UNAVAILABLE_MESSAGE = '問卷目前無法使用。';
export const PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE = '目前沒有可顯示的聚合結果。';
export const PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY =
  '此頁不顯示總票數、選項票數、百分比、排名、趨勢或任何進度訊號。';

/** Frontend-owned explore unavailable copy. */
export const PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE =
  '無法載入更多問卷，請稍後再試。';
export const PUBLIC_EXPLORE_EMPTY_MESSAGE = '目前沒有正在收集中的公開問卷。';
export const PUBLIC_EXPLORE_EMPTY_SUMMARY =
  '你可以先發起一則問卷並分享投票連結。';
export const PUBLIC_EXPLORE_EMPTY_CTA_LABEL = '建立問卷';

/** Frontend-owned my-polls creator list empty-state copy. */
export const PUBLIC_MY_POLLS_EMPTY_MESSAGE = '你目前還沒有建立問卷。';
export const PUBLIC_MY_POLLS_EMPTY_SUMMARY =
  '你可以先建立一則問卷並分享投票連結。';
export const PUBLIC_MY_POLLS_EMPTY_HEADLINE = '你目前還沒有建立問卷';

/** Frontend-owned auth / profile action unavailable copy. */
export const PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE =
  '請先登入後查看你建立的問卷。';
export const PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE =
  '編輯個人資料前請先登入。';
export const PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE =
  '請先登入後再編輯個人資料。';
export const PUBLIC_AUTH_GUEST_SIGN_IN_CTA_ARIA_LABEL = '尚未登入，前往登入頁';

/** Frontend-owned create-poll demo unavailable-to-persist label. */
export const PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL = '建立問卷（展示用，不儲存）';

/** Frontend-owned lifecycle action unavailable copy. */
export const PUBLIC_LIFECYCLE_LOCKED_ACTION_UNAVAILABLE_MESSAGE =
  '問卷已公開結果並處於公開鎖定期，目前無法取消、下架或修改內容。';
export const PUBLIC_LIFECYCLE_CANCELLED_NOTE_MESSAGE =
  '此問卷已取消，不會產生公開結果。';
export const PUBLIC_LIFECYCLE_UNPUBLISHED_VISITOR_MESSAGE =
  '此問卷已下架，訪客無法再查看公開結果。';
export const PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE =
  '此狀態目前沒有可執行的發起者操作。';
export const PUBLIC_LIFECYCLE_DELETE_LOCKED_MESSAGE =
  '公開結果期間無法刪除問卷；鎖定期結束後請使用下架。';
export const PUBLIC_LIFECYCLE_INCOMPLETE_STATE_MESSAGE =
  '問卷狀態資料不完整，無法推進生命週期。';
export const PUBLIC_LIFECYCLE_INVALID_STATE_ACTION_MESSAGE =
  '目前問卷狀態無法執行此操作，請重新整理後再試。';
export const PUBLIC_LIFECYCLE_UNPUBLISH_LOCKED_MESSAGE =
  '公開鎖定期尚未結束，目前無法下架。';
export const PUBLIC_LIFECYCLE_ALREADY_CANCELLED_MESSAGE = '此問卷已取消。';
export const PUBLIC_LIFECYCLE_ALREADY_UNPUBLISHED_MESSAGE = '此問卷已下架。';
export const PUBLIC_LIFECYCLE_FORBIDDEN_MESSAGE = '僅發起者可執行此操作。';
export const PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE =
  '需要發起者身分才能執行此操作。';
export const PUBLIC_LIFECYCLE_POLL_NOT_FOUND_MESSAGE =
  '找不到此問卷，可能已刪除或連結有誤。';
export const PUBLIC_LIFECYCLE_REVEAL_TOO_EARLY_MESSAGE =
  '尚未到預定截止時間，無法結束收集並公開結果。';
export const PUBLIC_LIFECYCLE_NOT_COLLECTING_MESSAGE =
  '問卷目前不在收集中，無法執行此操作。';
export const PUBLIC_LIFECYCLE_POLL_CLOSED_MESSAGE =
  '此問卷已結束，無法再變更狀態。';
export const PUBLIC_LIFECYCLE_GENERIC_ACTION_UNAVAILABLE_MESSAGE =
  '無法執行此操作，請確認問卷狀態後再試。';

/** Allowlist of safe user-visible disabled / unavailable messages across public surfaces. */
export const PUBLIC_UNAVAILABLE_USER_MESSAGES = [
  PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE,
  PUBLIC_VOTE_ROUTE_MISSING_ID_MESSAGE,
  PUBLIC_VOTE_ROUTE_INVALID_ID_MESSAGE,
  PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE,
  PUBLIC_VOTE_POLL_ENDED_MESSAGE,
  PUBLIC_VOTE_POLL_CLOSED_MESSAGE,
  PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE,
  PUBLIC_POLL_ARCHIVED_MESSAGE,
  PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
  PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
  PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
  PUBLIC_RESULTS_COLLECTING_TITLE,
  PUBLIC_RESULTS_COLLECTING_SUMMARY,
  PUBLIC_RESULTS_CANCELLED_TITLE,
  PUBLIC_RESULTS_CANCELLED_MESSAGE,
  PUBLIC_RESULTS_UNPUBLISHED_TITLE,
  PUBLIC_RESULTS_UNPUBLISHED_MESSAGE,
  PUBLIC_RESULTS_POLL_UNAVAILABLE_MESSAGE,
  PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY,
  PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE,
  PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
  PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE,
  PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE,
  PUBLIC_AUTH_GUEST_SIGN_IN_CTA_ARIA_LABEL,
  PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL,
  PUBLIC_LIFECYCLE_LOCKED_ACTION_UNAVAILABLE_MESSAGE,
  PUBLIC_LIFECYCLE_CANCELLED_NOTE_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISHED_VISITOR_MESSAGE,
  PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE,
  PUBLIC_LIFECYCLE_DELETE_LOCKED_MESSAGE,
  PUBLIC_LIFECYCLE_INCOMPLETE_STATE_MESSAGE,
  PUBLIC_LIFECYCLE_INVALID_STATE_ACTION_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISH_LOCKED_MESSAGE,
  PUBLIC_LIFECYCLE_ALREADY_CANCELLED_MESSAGE,
  PUBLIC_LIFECYCLE_ALREADY_UNPUBLISHED_MESSAGE,
  PUBLIC_LIFECYCLE_FORBIDDEN_MESSAGE,
  PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE,
  PUBLIC_LIFECYCLE_POLL_NOT_FOUND_MESSAGE,
  PUBLIC_LIFECYCLE_REVEAL_TOO_EARLY_MESSAGE,
  PUBLIC_LIFECYCLE_NOT_COLLECTING_MESSAGE,
  PUBLIC_LIFECYCLE_POLL_CLOSED_MESSAGE,
  PUBLIC_LIFECYCLE_GENERIC_ACTION_UNAVAILABLE_MESSAGE,
];

/** Frontend-owned auth / navigation CTA link labels. */
export const PUBLIC_CTA_SIGN_IN_LABEL = '登入';
export const PUBLIC_CTA_REGISTER_LABEL = '註冊';
export const PUBLIC_CTA_GO_TO_LOGIN_LABEL = '前往登入';
export const PUBLIC_CTA_GO_TO_REGISTER_LABEL = '前往註冊';
export const PUBLIC_CTA_GO_TO_LOGIN_ARIA_LABEL = '前往登入頁';
export const PUBLIC_CTA_GO_TO_REGISTER_ARIA_LABEL = '前往註冊頁建立帳號';
export const PUBLIC_CTA_CREATE_ACCOUNT_LABEL = '建立帳號';
export const PUBLIC_CTA_GO_TO_LOGIN_FROM_REGISTRATION_LABEL = '已有帳號，前往登入';
export const PUBLIC_CTA_GO_HOME_LABEL = '返回首頁';

/** Frontend-owned site navigation CTA link labels. */
export const PUBLIC_CTA_HOME_LABEL = '首頁';
export const PUBLIC_CTA_EXPLORE_LABEL = '探索';
export const PUBLIC_CTA_CREATE_POLL_NAV_LABEL = '發起提問';
export const PUBLIC_CTA_PROFILE_NAV_LABEL = '個人資料';

/** Frontend-owned profile CTA link labels. */
export const PUBLIC_CTA_GO_TO_PROFILE_LABEL = '前往個人資料';

/** Frontend-owned vote / results CTA link labels. */
export const PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL = '前往投票頁';
export const PUBLIC_CTA_GO_TO_VOTE_LABEL = '前往投票';
export const PUBLIC_CTA_OPEN_VOTE_PAGE_LABEL = '開啟投票頁';
export const PUBLIC_CTA_VOTE_PAGE_SHORT_LABEL = '投票頁';
export const PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL = '查看公開結果頁';
export const PUBLIC_CTA_OPEN_PUBLIC_RESULTS_LABEL = '開啟公開結果頁';
export const PUBLIC_CTA_VIEW_COLLECTING_RESULTS_LABEL = '查看收集中結果頁';
export const PUBLIC_CTA_VIEW_RESULTS_LABEL = '查看結果';
export const PUBLIC_CTA_VIEW_LOCKED_RESULTS_LABEL = '查看結果（鎖定期）';
export const PUBLIC_CTA_VIEW_CANCELLED_EXPLAINER_LABEL = '查看取消說明';
export const PUBLIC_CTA_VIEW_UNPUBLISHED_EXPLAINER_LABEL = '查看下架說明';
export const PUBLIC_CTA_CREATOR_RESULTS_LABEL = '結果頁（發起者）';

/** Frontend-owned creator / my-polls CTA link labels. */
export const PUBLIC_CTA_MY_POLLS_LABEL = '我的問卷';
export const PUBLIC_CTA_GO_TO_MY_POLLS_LABEL = '前往我的問卷';
export const PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL = '前往建立問卷（即時模式）';

/** Frontend-owned share / copy CTA link labels. */
export const PUBLIC_CTA_COPY_VOTE_LINK_LABEL = '複製投票連結';
export const PUBLIC_CTA_COPY_RESULT_LINK_LABEL = '複製結果連結';
export const PUBLIC_CTA_SHARE_VOTE_LINK_LABEL = '分享投票連結';
export const PUBLIC_CTA_SHARE_VOTE_LINK_ARIA_LABEL = '複製投票頁完整網址到剪貼簿';
export const PUBLIC_CTA_COPY_RESULT_LINK_ARIA_LABEL = '複製結果頁完整網址到剪貼簿';
export const PUBLIC_CTA_SHARE_VOTE_URL_LABEL = '投票連結（分享給參與者）';
export const PUBLIC_CTA_SHARE_RESULT_URL_LABEL = '結果連結（公開唯讀統計）';

/** Allowlist of safe user-visible CTA / link labels across public surfaces. */
export const PUBLIC_CTA_LINK_LABELS = [
  PUBLIC_CTA_SIGN_IN_LABEL,
  PUBLIC_CTA_REGISTER_LABEL,
  PUBLIC_CTA_GO_TO_LOGIN_LABEL,
  PUBLIC_CTA_GO_TO_REGISTER_LABEL,
  PUBLIC_CTA_GO_TO_LOGIN_ARIA_LABEL,
  PUBLIC_CTA_GO_TO_REGISTER_ARIA_LABEL,
  PUBLIC_CTA_CREATE_ACCOUNT_LABEL,
  PUBLIC_CTA_GO_TO_LOGIN_FROM_REGISTRATION_LABEL,
  PUBLIC_CTA_GO_HOME_LABEL,
  PUBLIC_CTA_HOME_LABEL,
  PUBLIC_CTA_EXPLORE_LABEL,
  PUBLIC_CTA_CREATE_POLL_NAV_LABEL,
  PUBLIC_CTA_PROFILE_NAV_LABEL,
  PUBLIC_CTA_GO_TO_PROFILE_LABEL,
  PUBLIC_AUTH_GUEST_SIGN_IN_CTA_ARIA_LABEL,
  PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL,
  PUBLIC_CTA_GO_TO_VOTE_LABEL,
  PUBLIC_CTA_OPEN_VOTE_PAGE_LABEL,
  PUBLIC_CTA_VOTE_PAGE_SHORT_LABEL,
  PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL,
  PUBLIC_CTA_OPEN_PUBLIC_RESULTS_LABEL,
  PUBLIC_CTA_VIEW_COLLECTING_RESULTS_LABEL,
  PUBLIC_CTA_VIEW_RESULTS_LABEL,
  PUBLIC_CTA_VIEW_LOCKED_RESULTS_LABEL,
  PUBLIC_CTA_VIEW_CANCELLED_EXPLAINER_LABEL,
  PUBLIC_CTA_VIEW_UNPUBLISHED_EXPLAINER_LABEL,
  PUBLIC_CTA_CREATOR_RESULTS_LABEL,
  PUBLIC_CTA_MY_POLLS_LABEL,
  PUBLIC_CTA_GO_TO_MY_POLLS_LABEL,
  PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL,
  PUBLIC_CTA_COPY_VOTE_LINK_LABEL,
  PUBLIC_CTA_COPY_RESULT_LINK_LABEL,
  PUBLIC_CTA_SHARE_VOTE_LINK_LABEL,
  PUBLIC_CTA_SHARE_VOTE_LINK_ARIA_LABEL,
  PUBLIC_CTA_COPY_RESULT_LINK_ARIA_LABEL,
  PUBLIC_CTA_SHARE_VOTE_URL_LABEL,
  PUBLIC_CTA_SHARE_RESULT_URL_LABEL,
];

/** Frontend-owned auth / session status badge labels. */
export const PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL = '未登入';
export const PUBLIC_AUTH_DEMO_IDENTITY_CHIP_STATUS_LABEL = 'MVP 測試身份';
export const PUBLIC_AUTH_SIGNED_IN_STATUS_ARIA_PREFIX = '已登入';
export const PUBLIC_AUTH_LOGOUT_STATUS_LABEL = '登出';
export const PUBLIC_AUTH_SIGN_IN_REQUIRED_STATUS_LABEL = '需登入';

/** Frontend-owned poll lifecycle status badge labels. */
export const PUBLIC_POLL_LIFECYCLE_DRAFT_STATUS_LABEL = '草稿';
export const PUBLIC_POLL_LIFECYCLE_COLLECTING_STATUS_LABEL = '收集中';
export const PUBLIC_POLL_LIFECYCLE_REVEALED_STATUS_LABEL = '已公開';
export const PUBLIC_POLL_LIFECYCLE_LOCKED_STATUS_LABEL = '公開鎖定期';
export const PUBLIC_POLL_LIFECYCLE_POST_LOCK_STATUS_LABEL = '鎖定期已結束';
export const PUBLIC_POLL_LIFECYCLE_CANCELLED_STATUS_LABEL = '已取消';
export const PUBLIC_POLL_LIFECYCLE_UNPUBLISHED_STATUS_LABEL = '已下架';

/** @type {Record<string, string>} */
export const PUBLIC_POLL_LIFECYCLE_STATUS_LABELS = {
  draft: PUBLIC_POLL_LIFECYCLE_DRAFT_STATUS_LABEL,
  collecting: PUBLIC_POLL_LIFECYCLE_COLLECTING_STATUS_LABEL,
  revealed: PUBLIC_POLL_LIFECYCLE_REVEALED_STATUS_LABEL,
  locked: PUBLIC_POLL_LIFECYCLE_LOCKED_STATUS_LABEL,
  post_lock: PUBLIC_POLL_LIFECYCLE_POST_LOCK_STATUS_LABEL,
  cancelled: PUBLIC_POLL_LIFECYCLE_CANCELLED_STATUS_LABEL,
  unpublished: PUBLIC_POLL_LIFECYCLE_UNPUBLISHED_STATUS_LABEL,
};

/**
 * @param {string | null | undefined} lifecycleState
 */
export function formatPublicPollLifecycleStatusLabel(lifecycleState) {
  return (
    PUBLIC_POLL_LIFECYCLE_STATUS_LABELS[lifecycleState] ??
    PUBLIC_POLL_LIFECYCLE_DRAFT_STATUS_LABEL
  );
}

/** Frontend-owned explore feed status labels. */
export const PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL =
  PUBLIC_POLL_LIFECYCLE_COLLECTING_STATUS_LABEL;
export const PUBLIC_EXPLORE_COLLECTING_STATUS_HINT = '收集中 · 不顯示票數';

/** Frontend-owned results page status labels. */
export const PUBLIC_RESULTS_COLLECTING_STATUS_ARIA_LABEL = '收集中狀態說明';
export const PUBLIC_RESULTS_UNAVAILABLE_STATUS_ARIA_LABEL = '結果不可用說明';
export const PUBLIC_RESULTS_NOT_YET_VISIBLE_STATUS_LABEL = '尚不可查看結果';
export const PUBLIC_RESULTS_DEMO_READONLY_TITLE = '示範結果頁（唯讀）';
export const PUBLIC_RESULTS_PUBLIC_READONLY_TITLE = '公開結果（唯讀）';
export const PUBLIC_RESULTS_REFRESH_NOTICE_ARIA_LABEL = '結果顯示更新提示';

/** Frontend-owned vote page status labels. */
export const PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL = '投票成功';

/** Frontend-owned create-poll status labels. */
export const PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL = '建立問卷';
export const PUBLIC_CREATE_POLL_DEMO_MODE_STATUS_LABEL = '展示用（不儲存）';
export const PUBLIC_CREATE_POLL_LIVE_MODE_STATUS_LABEL = '即時模式';
export const PUBLIC_CREATE_POLL_SUCCESS_PANEL_ARIA_LABEL = '問卷建立成功';

/** Frontend-owned profile status labels. */
export const PUBLIC_PROFILE_COMPLETION_PROMPT_STATUS_ARIA_LABEL = '個人資料提示';
export const PUBLIC_PROFILE_COMPLETION_PROMPT_LOADING_STATUS_ARIA_LABEL =
  '個人資料提示載入中';
export const PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL = '資料未完成';

/** Frontend-owned demo UI state preview labels. */
export const PUBLIC_DEMO_UI_STATE_PREVIEW_ARIA_LABEL = '問卷狀態範例';
export const PUBLIC_DEMO_UI_STATE_PREVIEW_LEAD =
  '切換不同狀態範例（不代表真實問卷）：';

/** Allowlist of safe user-visible status badge / state labels across public surfaces. */
export const PUBLIC_STATUS_LABELS = [
  PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL,
  PUBLIC_AUTH_DEMO_IDENTITY_CHIP_STATUS_LABEL,
  PUBLIC_AUTH_SIGNED_IN_STATUS_ARIA_PREFIX,
  PUBLIC_AUTH_LOGOUT_STATUS_LABEL,
  PUBLIC_AUTH_SIGN_IN_REQUIRED_STATUS_LABEL,
  PUBLIC_POLL_LIFECYCLE_DRAFT_STATUS_LABEL,
  PUBLIC_POLL_LIFECYCLE_COLLECTING_STATUS_LABEL,
  PUBLIC_POLL_LIFECYCLE_REVEALED_STATUS_LABEL,
  PUBLIC_POLL_LIFECYCLE_LOCKED_STATUS_LABEL,
  PUBLIC_POLL_LIFECYCLE_POST_LOCK_STATUS_LABEL,
  PUBLIC_POLL_LIFECYCLE_CANCELLED_STATUS_LABEL,
  PUBLIC_POLL_LIFECYCLE_UNPUBLISHED_STATUS_LABEL,
  PUBLIC_EXPLORE_COLLECTING_STATUS_HINT,
  PUBLIC_RESULTS_COLLECTING_STATUS_ARIA_LABEL,
  PUBLIC_RESULTS_UNAVAILABLE_STATUS_ARIA_LABEL,
  PUBLIC_RESULTS_NOT_YET_VISIBLE_STATUS_LABEL,
  PUBLIC_RESULTS_COLLECTING_TITLE,
  PUBLIC_RESULTS_DEMO_READONLY_TITLE,
  PUBLIC_RESULTS_PUBLIC_READONLY_TITLE,
  PUBLIC_RESULTS_REFRESH_NOTICE_ARIA_LABEL,
  PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL,
  PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE,
  PUBLIC_VOTE_DEMO_SUCCESS_STATUS_MESSAGE,
  PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE,
  PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL,
  PUBLIC_CREATE_POLL_DEMO_MODE_STATUS_LABEL,
  PUBLIC_CREATE_POLL_LIVE_MODE_STATUS_LABEL,
  PUBLIC_CREATE_POLL_SUCCESS_PANEL_ARIA_LABEL,
  PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL,
  PUBLIC_PROFILE_COMPLETION_PROMPT_STATUS_ARIA_LABEL,
  PUBLIC_PROFILE_COMPLETION_PROMPT_LOADING_STATUS_ARIA_LABEL,
  PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL,
  PUBLIC_DEMO_UI_STATE_PREVIEW_ARIA_LABEL,
  PUBLIC_DEMO_UI_STATE_PREVIEW_LEAD,
];

/** Allowlist of safe user-visible empty / no-data messages across public surfaces. */
export const PUBLIC_EMPTY_STATE_MESSAGES = [
  PUBLIC_EXPLORE_EMPTY_MESSAGE,
  PUBLIC_EXPLORE_EMPTY_SUMMARY,
  PUBLIC_MY_POLLS_EMPTY_MESSAGE,
  PUBLIC_MY_POLLS_EMPTY_SUMMARY,
  PUBLIC_MY_POLLS_EMPTY_HEADLINE,
  PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE,
  PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE,
];

/** Allowlist of safe user-visible empty-state CTA labels. */
export const PUBLIC_EMPTY_STATE_LABELS = [
  PUBLIC_EXPLORE_EMPTY_CTA_LABEL,
  PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL,
];

/** Frontend-owned login form helper hints. */
export const PUBLIC_LOGIN_FORM_READY_HINT =
  '請輸入已核准的 production credential proof。登入狀態會由伺服器驗證後更新。';
export const PUBLIC_LOGIN_SHELL_DEMO_HINT =
  '本機展示請使用 /profile 與投票頁的 MVP 測試身份，或 localhost 的 creator_session 發起流程（?live=1）。';

/** Frontend-owned registration form helper hints. */
export const PUBLIC_REGISTRATION_READY_HINT =
  '請填寫帳號資料與已核准的 production credential proof。註冊完成後仍須前往登入。';

/** Frontend-owned profile completion prompt helper hint. */
export const PUBLIC_PROFILE_COMPLETION_PROMPT_HINT =
  '部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。若你尚未填寫，可至個人資料頁補充或更新；這不代表你一定符合或不符合任何投票資格。';

/** Frontend-owned explore page helper hints. */
export const PUBLIC_EXPLORE_PAGE_LEAD_HINT =
  '依最近發布顯示目前可公開探索、仍在收集中的問卷。不提供熱門、票數、個人化或榜單排序；列表亦不顯示票數或結果百分比。';
export const PUBLIC_EXPLORE_FEED_LIST_HINT = '顯示公開問卷列表';
export const PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT =
  '依最近發布排序；非熱門、票數、個人化或榜單。';

/** Frontend-owned results page intro helper hints. */
export const PUBLIC_RESULTS_INTRO_LEAD_HINT =
  '此為公開結果頁（唯讀）：可查看目前顯示安全的統計摘要，無法在此投票或編輯問卷。';
export const PUBLIC_RESULTS_INTRO_SCOPE_HINT =
  '本頁不含登入、個人化推薦、排行榜或 feed 列表。已公開結果為顯示安全的區間化摘要，非即時原始票數。';
export const PUBLIC_RESULTS_INTRO_VOTE_HINT = '若要參與投票，請前往投票頁：';

/** Frontend-owned creator flow helper hints. */
export const PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT =
  '問卷已建立。請先複製並分享「投票連結」給參與者；收集中不顯示票數或百分比。';
export const PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT =
  '可在下方變更問卷狀態，或前往「我的問卷」與「結果頁（發起者）」繼續管理。';
export const PUBLIC_CREATOR_MY_POLLS_LEAD_HINT =
  '以下為發起者工作階段可管理的問卷。可分享投票連結、查看結果，或變更公開狀態。';
export const PUBLIC_CREATOR_RESULTS_LEAD_HINT =
  '發起者操作區：須先「結束收集並公開結果」後，上方才會顯示公開的區間化統計。';
export const PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT =
  '收集中不顯示票數。請分享投票連結邀請參與；若要公開統計，請使用「結束收集並公開結果」。';
export const PUBLIC_CREATOR_LIFECYCLE_POST_LOCK_LEAD_HINT =
  '公開鎖定期已結束。若要讓訪客無法再查看公開結果，可使用「下架問卷」。';
export const PUBLIC_CREATOR_ACTION_CANCEL_HINT =
  '取消問卷：停止收集，不產生公開彙總結果，且無法恢復為收集中。';
export const PUBLIC_CREATOR_ACTION_CLOSE_HINT =
  '結束收集並公開結果：顯示區間化統計，並進入公開鎖定期（鎖定期內不可下架、修改或刪除）。';
export const PUBLIC_CREATOR_ACTION_UNPUBLISH_HINT =
  '下架問卷：訪客將無法再查看公開結果頁（須已過公開鎖定期）。';
export const PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX = '投票頁完整網址：';

/** Allowlist of safe user-visible help / hint / helper text across public surfaces. */
export const PUBLIC_HINT_TEXT_MESSAGES = [
  PUBLIC_LOGIN_FORM_READY_HINT,
  PUBLIC_LOGIN_SHELL_DEMO_HINT,
  PUBLIC_REGISTRATION_READY_HINT,
  PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
  PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
  PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
  PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
  PUBLIC_VOTE_SUCCESS_RESULT_HINT,
  PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT,
  PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD,
  PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD,
  PUBLIC_EXPLORE_PAGE_LEAD_HINT,
  PUBLIC_EXPLORE_FEED_LIST_HINT,
  PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT,
  PUBLIC_EXPLORE_COLLECTING_STATUS_HINT,
  PUBLIC_RESULTS_INTRO_LEAD_HINT,
  PUBLIC_RESULTS_INTRO_SCOPE_HINT,
  PUBLIC_RESULTS_INTRO_VOTE_HINT,
  PUBLIC_RESULTS_COLLECTING_SUMMARY,
  PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT,
  PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT,
  PUBLIC_CREATOR_MY_POLLS_LEAD_HINT,
  PUBLIC_CREATOR_RESULTS_LEAD_HINT,
  PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
  PUBLIC_CREATOR_LIFECYCLE_POST_LOCK_LEAD_HINT,
  PUBLIC_CREATOR_ACTION_CANCEL_HINT,
  PUBLIC_CREATOR_ACTION_CLOSE_HINT,
  PUBLIC_CREATOR_ACTION_UNPUBLISH_HINT,
  PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX,
  PUBLIC_DEMO_UI_STATE_PREVIEW_LEAD,
];

/** Shared public form field labels. */
export const PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL = 'Production credential proof';
export const PUBLIC_FORM_DISPLAY_NAME_LABEL = '顯示名稱';
export const PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL = '出生年月（僅到月份）';
export const PUBLIC_FORM_RESIDENTIAL_REGION_LABEL = '居住地區（粗粒度代碼）';
export const PUBLIC_FORM_POLL_TITLE_LABEL = '問卷標題';
export const PUBLIC_FORM_POLL_DESCRIPTION_LABEL = '補充說明（選填）';
export const PUBLIC_FORM_POLL_CATEGORY_LABEL = '分類（正式上線後開放）';
export const PUBLIC_FORM_POLL_OPTIONS_LEGEND = '選項（至少 2 項，最多 6 項）';
export const PUBLIC_FORM_POLL_OPTION_1_LABEL = '選項 1';
export const PUBLIC_FORM_POLL_OPTION_2_LABEL = '選項 2';
export const PUBLIC_FORM_POLL_OPTION_3_LABEL = '選項 3（選填）';
export const PUBLIC_FORM_POLL_OPTION_4_LABEL = '選項 4（選填）';
export const PUBLIC_FORM_POLL_CLOSE_AT_LABEL = '截止／結果公開時間（正式上線後開放）';
export const PUBLIC_FORM_POLL_ELIGIBILITY_AGE_LABEL = '年齡區間（正式上線後開放）';
export const PUBLIC_FORM_POLL_ELIGIBILITY_REGION_LABEL = '地區（正式上線後開放）';
export const PUBLIC_FORM_VOTE_OPTIONS_LEGEND = '請選擇一個選項';

/** Shared public form placeholders. */
export const PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER = 'YYYY-MM';
export const PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER = '輸入已核准的登入憑證';
export const PUBLIC_FORM_REGISTRATION_CREDENTIAL_PLACEHOLDER = '輸入已核准的註冊憑證';
export const PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER = '輸入顯示名稱';
export const PUBLIC_FORM_POLL_TITLE_PLACEHOLDER = '例如：你支持週休三日嗎？';
export const PUBLIC_FORM_POLL_DESCRIPTION_PLACEHOLDER = '補充背景，不影響選項';
export const PUBLIC_FORM_POLL_ELIGIBILITY_AGE_PLACEHOLDER = '例如 18–30';
export const PUBLIC_FORM_POLL_ELIGIBILITY_REGION_PLACEHOLDER = '例如 高雄市';

/** Shared select prompts for coarse region fields. */
export const PUBLIC_FORM_REGION_SELECT_PROMPT = '請選擇';
export const PUBLIC_FORM_REGION_EMPTY_OPTION = '未填寫';

/** Frontend-owned field-level hints adjacent to public form inputs. */
export const PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT =
  '不要輸入 X-User-Id、creator 身分、個人資料或任何問卷選項資料。';
export const PUBLIC_FORM_REGISTRATION_DISPLAY_NAME_HINT =
  '此名稱會作為帳號顯示名稱；最多 80 個字元。';
export const PUBLIC_FORM_REGISTRATION_BIRTH_YEAR_MONTH_HINT =
  '官方投票會依產品規則檢查年齡資格；只收集到年／月。';
export const PUBLIC_FORM_REGISTRATION_RESIDENTIAL_REGION_HINT =
  '只使用粗粒度地區代碼，不要求街道、門牌或精確位置。';
export const PUBLIC_FORM_REGISTRATION_CREDENTIAL_FIELD_HINT =
  '憑證只會以 Authorization Bearer 傳送，不會放入註冊資料 JSON。';
export const PUBLIC_FORM_PROFILE_BIRTH_YEAR_MONTH_HINT =
  '官方投票會在投票當下依產品規則檢查年齡資格。我們只收集到「年／月」，不會要求具體日期或年齡天數。可留空或清除。';
export const PUBLIC_FORM_PROFILE_RESIDENTIAL_REGION_HINT =
  '官方投票會在投票當下依產品規則檢查地區資格。我們只收集粗粒度地區代碼（例如 TW-TPE），不要求街道、門牌或精確位置。可留空或清除。';

/** Allowlist of safe user-visible public form field labels. */
export const PUBLIC_FORM_FIELD_LABELS = [
  PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
  PUBLIC_FORM_DISPLAY_NAME_LABEL,
  PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL,
  PUBLIC_FORM_RESIDENTIAL_REGION_LABEL,
  PUBLIC_FORM_POLL_TITLE_LABEL,
  PUBLIC_FORM_POLL_DESCRIPTION_LABEL,
  PUBLIC_FORM_POLL_CATEGORY_LABEL,
  PUBLIC_FORM_POLL_OPTIONS_LEGEND,
  PUBLIC_FORM_POLL_OPTION_1_LABEL,
  PUBLIC_FORM_POLL_OPTION_2_LABEL,
  PUBLIC_FORM_POLL_OPTION_3_LABEL,
  PUBLIC_FORM_POLL_OPTION_4_LABEL,
  PUBLIC_FORM_POLL_CLOSE_AT_LABEL,
  PUBLIC_FORM_POLL_ELIGIBILITY_AGE_LABEL,
  PUBLIC_FORM_POLL_ELIGIBILITY_REGION_LABEL,
  PUBLIC_FORM_VOTE_OPTIONS_LEGEND,
];

/** Allowlist of safe user-visible public form placeholders. */
export const PUBLIC_FORM_PLACEHOLDERS = [
  PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER,
  PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER,
  PUBLIC_FORM_REGISTRATION_CREDENTIAL_PLACEHOLDER,
  PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER,
  PUBLIC_FORM_POLL_TITLE_PLACEHOLDER,
  PUBLIC_FORM_POLL_DESCRIPTION_PLACEHOLDER,
  PUBLIC_FORM_POLL_ELIGIBILITY_AGE_PLACEHOLDER,
  PUBLIC_FORM_POLL_ELIGIBILITY_REGION_PLACEHOLDER,
];

/** Allowlist of safe user-visible public form field hints. */
export const PUBLIC_FORM_FIELD_HINTS = [
  PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT,
  PUBLIC_FORM_REGISTRATION_DISPLAY_NAME_HINT,
  PUBLIC_FORM_REGISTRATION_BIRTH_YEAR_MONTH_HINT,
  PUBLIC_FORM_REGISTRATION_RESIDENTIAL_REGION_HINT,
  PUBLIC_FORM_REGISTRATION_CREDENTIAL_FIELD_HINT,
  PUBLIC_FORM_PROFILE_BIRTH_YEAR_MONTH_HINT,
  PUBLIC_FORM_PROFILE_RESIDENTIAL_REGION_HINT,
];

const GENERIC_LOAD_FAILURE = VOTE_PAGE_LOAD_FAILURE;

/**
 * Returns a frontend-owned user message from a caught error, or fallback.
 * Never surfaces foreign error.message (network, backend, runtime).
 *
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @param {readonly string[]} allowedMessages
 */
export function resolvePublicErrorUserMessage(
  error,
  fallbackMessage,
  allowedMessages,
) {
  if (
    error instanceof Error &&
    typeof error.message === 'string' &&
    allowedMessages.includes(error.message)
  ) {
    return error.message;
  }
  return fallbackMessage;
}

const PUBLIC_POLL_LIFECYCLE_STATES = [
  'draft',
  'collecting',
  'cancelled',
  'revealed',
  'locked',
  'post_lock',
  'unpublished',
];

export function setBusySubmitButton(
  button,
  { busy, idleLabel, busyLabel },
) {
  button.disabled = busy;
  button.setAttribute('aria-busy', busy ? 'true' : 'false');
  button.textContent = busy ? busyLabel : idleLabel;
}

export function announceToStatusRegion(element, text) {
  if (element) {
    element.textContent = text;
  }
}

export function markRegionBusy(element, busy) {
  if (!element) {
    return;
  }
  if (busy) {
    element.setAttribute('aria-busy', 'true');
  } else {
    element.removeAttribute('aria-busy');
  }
}

export function focusFirstFocusable(root) {
  const target = root.querySelector('a[href], button:not([disabled])');
  target?.focus?.();
}

export function buildPublicVotePath(pollId) {
  return `/vote/${encodeURIComponent(pollId)}`;
}

export function buildPublicResultPath(pollId) {
  return `/results/${encodeURIComponent(pollId)}`;
}

export function buildAbsoluteUrl(path, locationObject = globalThis.location) {
  return new URL(path, locationObject.origin).href;
}

export async function parsePollApiError(response) {
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string') {
      return {
        status: response.status,
        errorCode: body.error,
        message: typeof body.message === 'string' ? body.message : null,
      };
    }
  } catch {
    // ignore malformed error payloads
  }
  return { status: response.status, errorCode: null, message: null };
}

export function messageForPollLoadFailure({ status, errorCode, message } = {}) {
  if (errorCode === 'INVALID_POLL_ID') {
    return PUBLIC_POLL_INVALID_ID_MESSAGE;
  }
  if (status === 404 || errorCode === 'POLL_NOT_FOUND') {
    return PUBLIC_POLL_NOT_FOUND_MESSAGE;
  }
  if (errorCode === 'POLL_VALIDATION') {
    if (message === 'Poll is archived') {
      return PUBLIC_POLL_ARCHIVED_MESSAGE;
    }
    if (message === 'Poll is closed') {
      return PUBLIC_VOTE_POLL_ENDED_MESSAGE;
    }
    if (message === 'Poll is no longer accepting responses') {
      return PUBLIC_VOTE_POLL_CLOSED_MESSAGE;
    }
    if (message === 'Poll is not accepting responses') {
      return PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE;
    }
    return PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE;
  }
  if (status === 400) {
    return PUBLIC_POLL_INVALID_REQUEST_MESSAGE;
  }
  return GENERIC_LOAD_FAILURE;
}

export function messageForVoteSubmitFailure() {
  return GENERIC_VOTE_SUBMIT_FAILURE;
}

/**
 * @param {unknown} detail
 * @returns {string | null}
 */
export function getPublicLifecycleStateFromPoll(detail) {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
    return null;
  }
  const state = /** @type {{ public_lifecycle_state?: unknown }} */ (detail)
    .public_lifecycle_state;
  if (
    typeof state === 'string' &&
    PUBLIC_POLL_LIFECYCLE_STATES.includes(state)
  ) {
    return state;
  }
  return null;
}

/**
 * @param {unknown} detail
 */
export function isPollAcceptingVotes(detail) {
  const lifecycle = getPublicLifecycleStateFromPoll(detail);
  if (lifecycle !== null) {
    return lifecycle === 'collecting';
  }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const status = /** @type {{ status?: unknown }} */ (detail).status;
    return status === 'active';
  }
  return false;
}

/**
 * @param {unknown} detail
 */
export function messageForPollVotingBlocked(detail) {
  const lifecycle = getPublicLifecycleStateFromPoll(detail);
  if (
    lifecycle === 'cancelled' ||
    lifecycle === 'unpublished' ||
    lifecycle === 'draft'
  ) {
    return PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE;
  }
  if (
    lifecycle === 'revealed' ||
    lifecycle === 'locked' ||
    lifecycle === 'post_lock'
  ) {
    return PUBLIC_VOTE_POLL_ENDED_MESSAGE;
  }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const status = /** @type {{ status?: unknown }} */ (detail).status;
    if (status === 'closed') {
      return PUBLIC_VOTE_POLL_CLOSED_MESSAGE;
    }
  }
  return PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE;
}

export function renderPublicNav(root) {
  const nav = root.ownerDocument.createElement('nav');
  nav.className = 'public-nav';
  nav.setAttribute('aria-label', '網站導覽');

  const home = root.ownerDocument.createElement('a');
  home.href = '/';
  home.textContent = PUBLIC_CTA_HOME_LABEL;
  nav.append(home);

  const explore = root.ownerDocument.createElement('a');
  explore.href = '/explore';
  explore.textContent = PUBLIC_CTA_EXPLORE_LABEL;
  nav.append(explore);

  const create = root.ownerDocument.createElement('a');
  create.href = '/polls/new';
  create.textContent = PUBLIC_CTA_CREATE_POLL_NAV_LABEL;
  nav.append(create);

  const profile = root.ownerDocument.createElement('a');
  profile.href = '/profile';
  profile.textContent = PUBLIC_CTA_PROFILE_NAV_LABEL;
  nav.append(profile);

  root.append(nav);
  return nav;
}

export function renderPublicErrorPanel(
  root,
  { title, message, showNav = true } = {},
) {
  root.replaceChildren();
  root.hidden = false;
  root.setAttribute('role', 'alert');

  const heading = root.ownerDocument.createElement('h2');
  heading.className = 'panel-heading';
  heading.textContent = title;
  root.append(heading);

  const body = root.ownerDocument.createElement('p');
  body.className = 'panel-message';
  body.textContent = message;
  root.append(body);

  if (showNav) {
    renderPublicNav(root);
  }
}

export async function copyTextToClipboard(text, {
  clipboard = globalThis.navigator?.clipboard,
  documentObject = globalThis.document,
  prompt = globalThis.prompt,
} = {}) {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      // fall through to legacy fallback
    }
  }

  try {
    const textarea = documentObject.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    documentObject.body.append(textarea);
    textarea.select();
    const copied = documentObject.execCommand('copy');
    textarea.remove();
    if (copied) {
      return { ok: true, method: 'execCommand' };
    }
  } catch {
    // fall through
  }

  if (typeof prompt === 'function') {
    prompt('請手動複製以下連結：', text);
    return { ok: false, method: 'prompt' };
  }

  return { ok: false, method: 'none' };
}

function appendShareUrlDisplay(parent, { label, url }) {
  const row = parent.ownerDocument.createElement('div');
  row.className = 'share-url-row';

  const rowLabel = parent.ownerDocument.createElement('p');
  rowLabel.className = 'share-url-label';
  rowLabel.textContent = label;
  row.append(rowLabel);

  const code = parent.ownerDocument.createElement('code');
  code.className = 'share-url';
  code.textContent = url;
  row.append(code);

  parent.append(row);
  return code;
}

function appendCopyButton(parent, { label, url, statusTarget, ariaLabel }) {
  const button = parent.ownerDocument.createElement('button');
  button.type = 'button';
  button.className = 'copy-link-button';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel ?? label);
  button.addEventListener('click', async () => {
    const result = await copyTextToClipboard(url);
    if (statusTarget) {
      if (result.ok) {
        statusTarget.textContent = PUBLIC_SHARE_LINK_COPIED_MESSAGE;
      } else if (result.method === 'prompt') {
        statusTarget.textContent = PUBLIC_SHARE_LINK_PROMPT_MESSAGE;
      } else {
        statusTarget.textContent = PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE;
      }
    }
  });
  parent.append(button);
}

export function renderPollSharePanel(root, pollId, {
  locationObject = globalThis.location,
  includeCopyButtons = true,
} = {}) {
  root.replaceChildren();
  root.hidden = false;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', PUBLIC_CREATE_POLL_SUCCESS_PANEL_ARIA_LABEL);

  const votePath = buildPublicVotePath(pollId);
  const resultPath = buildPublicResultPath(pollId);
  const voteUrl = buildAbsoluteUrl(votePath, locationObject);
  const resultUrl = buildAbsoluteUrl(resultPath, locationObject);

  const hint = root.ownerDocument.createElement('p');
  hint.className = 'panel-message';
  hint.textContent = PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD;
  root.append(hint);

  const copyStatus = root.ownerDocument.createElement('p');
  copyStatus.className = 'copy-status';
  copyStatus.setAttribute('role', 'status');
  copyStatus.setAttribute('aria-live', 'polite');
  root.append(copyStatus);

  appendShareUrlDisplay(root, { label: PUBLIC_CTA_SHARE_VOTE_URL_LABEL, url: voteUrl });

  const voteLink = root.ownerDocument.createElement('a');
  voteLink.className = 'mvp-action-link';
  voteLink.href = votePath;
  voteLink.textContent = PUBLIC_CTA_OPEN_VOTE_PAGE_LABEL;
  root.append(voteLink);

  if (includeCopyButtons) {
    appendCopyButton(root, {
      label: PUBLIC_CTA_COPY_VOTE_LINK_LABEL,
      url: voteUrl,
      statusTarget: copyStatus,
      ariaLabel: PUBLIC_CTA_SHARE_VOTE_LINK_ARIA_LABEL,
    });
  }

  appendShareUrlDisplay(root, { label: PUBLIC_CTA_SHARE_RESULT_URL_LABEL, url: resultUrl });

  const resultLink = root.ownerDocument.createElement('a');
  resultLink.className = 'mvp-action-link';
  resultLink.href = resultPath;
  resultLink.textContent = PUBLIC_CTA_OPEN_PUBLIC_RESULTS_LABEL;
  root.append(resultLink);

  if (includeCopyButtons) {
    appendCopyButton(root, {
      label: PUBLIC_CTA_COPY_RESULT_LINK_LABEL,
      url: resultUrl,
      statusTarget: copyStatus,
      ariaLabel: PUBLIC_CTA_COPY_RESULT_LINK_ARIA_LABEL,
    });
  }
}

/** Fake local-only voter UUID; must exist in DB with trust_level=official when using demo:public:local. */
export const LOCAL_DEMO_VOTER_USER_ID = '44444444-4444-4444-8444-444444444444';

/** Second local demo voter for a second browser session (still localhost-only header). */
export const LOCAL_DEMO_VOTER_B_USER_ID = '55555555-5555-5555-8555-555555555555';

export function isLocalDemoHostname(hostname) {
  return hostname === '127.0.0.1' || hostname === 'localhost';
}

/**
 * On 127.0.0.1 / localhost only, use seeded demo voter id so manual npm/demo voting works.
 * Production hosts keep random runtime UUID (no durable storage).
 */
export function resolvePublicMvpUserId(uuidFactory = () => globalThis.crypto.randomUUID()) {
  const hostname = globalThis.location?.hostname;
  if (hostname && isLocalDemoHostname(hostname)) {
    const params = new URLSearchParams(globalThis.location?.search ?? '');
    if (params.get('demoVoter') === 'b') {
      return LOCAL_DEMO_VOTER_B_USER_ID;
    }
    return LOCAL_DEMO_VOTER_USER_ID;
  }
  return uuidFactory();
}
