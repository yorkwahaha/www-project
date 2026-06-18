/**
 * Phase 257 — public help / FAQ / guide copy (Traditional Chinese).
 * Presentation-only strings; no storage, tracking, or API behavior.
 */

export const PUBLIC_LOGIN_FORM_READY_HINT =
  '請輸入已核准的登入憑證。登入狀態會由伺服器驗證後更新。';

export const PUBLIC_LOGIN_SHELL_DEMO_HINT =
  '本機展示可使用個人資料頁與投票頁的測試身份示範，或以即時模式（?live=1）發起問卷。';

export const PUBLIC_REGISTRATION_READY_HINT =
  '請填寫帳號資料與已核准的登入憑證。註冊完成後仍須前往登入。';

export const PUBLIC_PROFILE_COMPLETION_PROMPT_HINT =
  '部分正式投票可能在送出當下檢查出生年月與居住地區。若尚未填寫，可至個人資料頁補充；這不代表你一定符合或不符合任何投票資格。';

export const PUBLIC_HOME_HERO_LEAD =
  '收集中不公開票數；截止後才顯示彙總結果，並進入約 5 天公開鎖定期。';

/**
 * Phase 301 — home swipe card visual shell copy (Traditional Chinese).
 * Collecting-only; never references counts, percentages, totals, ranks,
 * trends, progress or any aggregate. Presentation-only strings.
 */
export const PUBLIC_HOME_SWIPE_HEADING = '大家想知道 — 匿名問卷卡片';
export const PUBLIC_HOME_SWIPE_STAGE_LABEL = '問卷卡片';
export const PUBLIC_HOME_SWIPE_STAGE_ROLEDESCRIPTION = '可向下滑動瀏覽的問卷卡片列表';
export const PUBLIC_HOME_SWIPE_COLLECTING_HINT = '收集中 · 答案截止後才公開';
export const PUBLIC_HOME_SWIPE_ANSWER_CTA = '回答';
export const PUBLIC_HOME_SWIPE_REVEALED_CTA = '看完整結果';
export const PUBLIC_HOME_SWIPE_REVEALED_HINT = '已公開 · 點擊看完整結果';
export const PUBLIC_HOME_SWIPE_NEXT_HINT = '向下滑動看下一則';
export const PUBLIC_HOME_SWIPE_LOADING_MESSAGE = '載入問卷卡片中，請稍候。';
export const PUBLIC_HOME_SWIPE_LIST_READY_MESSAGE = '已載入問卷卡片，可向下滑動瀏覽。';
export const PUBLIC_HOME_SWIPE_EMPTY_MESSAGE = '目前沒有可瀏覽的公開問卷。';
export const PUBLIC_HOME_SWIPE_EMPTY_SUMMARY = '請稍後再回來看看，或建立一則新問卷。';
export const PUBLIC_HOME_SWIPE_EMPTY_CTA_LABEL = '建立問卷';
export const PUBLIC_HOME_SWIPE_ERROR_MESSAGE = '目前無法載入問卷卡片，請稍後再試。';
export const PUBLIC_HOME_SWIPE_RETRY_LABEL = '重新載入';
export const PUBLIC_HOME_SWIPE_LOAD_MORE_LABEL = '載入更多';
export const PUBLIC_HOME_SWIPE_EXPLORE_FALLBACK_LABEL = '改用列表瀏覽';

export const PUBLIC_EXPLORE_PAGE_LEAD =
  '依最近發布顯示目前可公開探索、仍在收集中的問卷。不提供熱門、票數、個人化或榜單排序；列表亦不顯示票數或結果百分比。';

export const PUBLIC_REGISTRATION_PAGE_BANNER_BODY =
  '正式註冊表單已開放：送出顯示名稱、出生年月、居住地區與已核准憑證。註冊完成後請前往登入頁；不會自動登入，也不會自動建立瀏覽器工作階段。';

export const PUBLIC_LOGIN_PAGE_BANNER_BODY =
  '正式登入表單已開放：送出已核准憑證即可登入。若剛完成註冊，請用註冊時的相同憑證。缺少有效憑證時，受保護功能會拒絕存取，不會退回本機測試身份。';

export const PUBLIC_LOGIN_FORM_REGISTRATION_CROSSLINK_LEAD =
  '若你剛完成註冊，請用相同憑證登入。尚未註冊？請先前往';

export const PUBLIC_LOGIN_FORM_REGISTRATION_CROSSLINK_LINK_LABEL = '註冊頁';

export const PUBLIC_LOGIN_FORM_REGISTRATION_CROSSLINK_TAIL = '建立帳號。';

export const PUBLIC_LOGIN_FORM_REGISTRATION_CROSSLINK_HINT =
  '若你剛完成註冊，請用相同憑證登入。尚未註冊？請先前往註冊頁建立帳號。';

export const PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT =
  '登入後可先至個人資料頁填寫出生年月與居住地區，有助準備正式投票；這不表示可保證符合任何問卷資格。';

export const PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE =
  '儲存後可在投票當下由系統依各問卷規則判定資格。這不表示可保證符合或不符合任何問卷資格。';

export const PUBLIC_LOGIN_PAGE_LEAD_PRIMARY =
  '登入會建立瀏覽器工作階段，並在頁首顯示帳號名稱。若你剛完成註冊，請用相同憑證登入；若尚未註冊，請先到註冊頁建立帳號（註冊不會自動登入）。';

export const PUBLIC_LOGIN_PAGE_LEAD_SECONDARY =
  '正式環境中，個人資料、投票與發起者操作須透過已核准憑證；若後端無法驗證身分，系統會拒絕存取，不會退回本機測試身份。';

export const PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY =
  '註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。請用相同憑證登入後，頁首才會顯示帳號名稱。';

export const PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY =
  '註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。完成後請使用相同憑證到登入頁登入；登入才會控制頁首的已登入狀態。';

export const PUBLIC_REGISTRATION_PAGE_LEAD_SECONDARY =
  '本表單不會要求生日日期、街道門牌、精確定位或問卷選項資料。';

export const PUBLIC_PROFILE_PAGE_LEAD =
  '填寫出生年月與居住地區有助準備部分問卷的正式投票資格檢查。本頁僅可編輯這兩類欄位；填寫不表示可保證符合或不符合任何問卷資格。';

export const PUBLIC_MY_POLLS_PAGE_LEAD =
  '在此瀏覽並管理你透過本站台建立流程所建立的問卷。收集中看不到票數；鎖定期內無法下架、修改或刪除。';

export const PUBLIC_CREATE_POLL_PAGE_LEAD =
  '在此建立並發布問卷。發布後無法在此修改題目或選項；收集中看不到期中票數或百分比。';

export const PUBLIC_CREATE_POLL_PAGE_BANNER_BODY =
  '目前為展示模式：此頁預設僅做欄位檢查，資料不會儲存。若要實際建立並管理問卷，請在網址加上 ?live=1（即時模式）。';

export const PUBLIC_CREATE_POLL_LIVE_MODE_HINT =
  '即時模式會實際建立問卷。建立成功後可至「我的問卷」管理、分享投票連結，或執行取消／結束收集／下架等狀態操作。';

export const PUBLIC_CREATE_POLL_MY_POLLS_NAV_HINT_LEAD = '建立問卷後，可到';

export const PUBLIC_CREATE_POLL_MY_POLLS_NAV_HINT_TAIL =
  '管理已建立的問卷、分享投票連結。';

export const PUBLIC_MY_POLLS_PAGE_BANNER_BODY =
  '此頁預設為範例儀表板，資料僅供預覽。若要管理你實際建立的問卷，請在網址加上 ?live=1（即時模式）；須先完成登入與發起者身分準備。';

export const PUBLIC_MY_POLLS_QUOTA_PANEL_LEAD =
  '額度與品質點數依信任等級規劃（正式上線後計算）。鎖定期內不可下架或修改。下方表格為範例；即時管理請先';

export const PUBLIC_MY_POLLS_QUOTA_PANEL_MID = '，再開啟 ';

export const PUBLIC_MY_POLLS_QUOTA_PANEL_TAIL = '。';

export const PUBLIC_MY_POLLS_CREATE_POLL_NAV_HINT_LEAD = '尚未建立問卷？可前往';

export const PUBLIC_MY_POLLS_CREATE_POLL_NAV_HINT_TAIL = '，完成後回到此頁管理。';

export const PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD =
  '目前為示範頁：展示用，不儲存；以範例展示各狀態（如 /results/demo）。收集中不顯示票數、百分比、總計、排名、趨勢或進度。';

export const PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD =
  '此為公開結果頁（唯讀）：可查看目前允許顯示的統計摘要，無法在此投票或編輯問卷。收集中不顯示票數、百分比、總計、排名、趨勢或進度；已公開結果為顯示安全的區間化摘要。';

export const PUBLIC_VOTE_PAGE_REMINDER_LEAD =
  '示範問卷（如 /vote/demo）僅展示流程，不儲存票數。正式問卷可閱讀內容、選擇一個選項並送出；正式投票可能需要登入，送出當下由系統判定是否可計票。';

export const PUBLIC_EXPLORE_PAGE_LEAD_HINT = PUBLIC_EXPLORE_PAGE_LEAD;

export const PUBLIC_EXPLORE_FEED_LIST_HINT = '顯示公開問卷列表';

export const PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT =
  '依最近發布排序；非熱門、票數、個人化或榜單。';

export const PUBLIC_RESULTS_INTRO_LEAD_HINT =
  '此為公開結果頁（唯讀）：可查看目前允許顯示的統計摘要，無法在此投票或編輯問卷。';

export const PUBLIC_RESULTS_INTRO_SCOPE_HINT =
  '本頁不含個人化推薦或排行榜。收集中不顯示票數；已公開結果為區間化摘要，非即時原始票數。';

export const PUBLIC_RESULTS_INTRO_VOTE_HINT = '若要參與投票，請前往投票頁：';

export const PUBLIC_VOTE_POLICY_LOGIN_TEXT =
  '正式投票可能需要登入；送出當下才會判定是否可計票。此提示不代表一定可以完成投票。';

export const PUBLIC_VOTE_POLICY_TRUST_LEVELS_LINK_LABEL = '說明';

export const PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT =
  '收集中不顯示票數、百分比、總計、排名、趨勢或進度；發起者也看不到期中統計。';

export const PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL = '常見問題';

export const PUBLIC_VOTE_POLICY_FOLLOW_RESULTS_TEXT =
  '暫不投票或稍後再試時，可關注結果，於公開後查看彙總。';

export const PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT =
  '投票後可協助回饋題目是否清楚易懂；此回饋不是按讚、評分、排名，也不是正式檢舉。';

export const PUBLIC_VOTE_COLLECTING_NOTICE_BODY = PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT;

export const PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_BODY =
  '暫不投票或稍後再試時，可關注結果公開通知（不含 Email／推播）。';

export const PUBLIC_VOTE_FOLLOW_RESULTS_MOCK_NOTE =
  '站內通知將在登入與通知系統完成後開放；目前不會儲存關注。';

export const PUBLIC_VOTE_VIEW_RESULTS_NAV_HINT_LEAD = '想查看公開結果頁說明？可';

export const PUBLIC_VOTE_VIEW_RESULTS_NAV_HINT_TAIL =
  '（唯讀；收集中不顯示票數或百分比）。';

export const PUBLIC_RESULTS_VOTE_NAV_HINT_LEAD = '尚未投票？可';

export const PUBLIC_RESULTS_VOTE_NAV_HINT_TAIL = '閱讀問卷、選擇選項並送出。';

export const PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT =
  '問卷已建立。請先複製並分享「投票連結」給參與者；收集中不顯示票數或百分比。';

export const PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT =
  '可在下方變更問卷狀態，或前往「我的問卷」繼續管理、分享投票連結。';

export const PUBLIC_CREATOR_MY_POLLS_LEAD_HINT =
  '以下為你透過本站台建立流程所建立、可管理的問卷。可分享投票連結、查看結果，或執行取消／結束收集／下架。';

export const PUBLIC_CREATOR_RESULTS_LEAD_HINT =
  '發起者操作區：須先「結束收集並公開結果」後，上方才會顯示公開的區間化統計。';

export const PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT =
  '收集中不顯示票數。請分享投票連結邀請參與；若要公開統計，請使用「結束收集並公開結果」。';

export const PUBLIC_CREATOR_LIFECYCLE_POST_LOCK_LEAD_HINT =
  '公開鎖定期已結束。若要讓訪客無法再查看公開結果，可使用「下架問卷」。';

export const PUBLIC_CREATOR_ACTION_CANCEL_HINT =
  '取消問卷：收集中停止，不產生公開彙總結果，且無法恢復為收集中。';

export const PUBLIC_CREATOR_ACTION_CLOSE_HINT =
  '結束收集並公開結果：顯示區間化統計，並進入公開鎖定期（鎖定期內不可下架、修改或刪除）。';

export const PUBLIC_CREATOR_ACTION_UNPUBLISH_HINT =
  '下架問卷：訪客將無法再查看公開結果頁（須已過公開鎖定期）。';

export const PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX = '投票頁完整網址：';

export const PUBLIC_FAQ_PAGE_HERO_LEAD =
  '帳號註冊登入、問卷建立、投票與結果查看，以及收集中盲測、截止公開、取消與下架的差別，這裡用最直白的方式說明。';

export const PUBLIC_FAQ_PAGE_BANNER_BODY =
  '政策說明頁：展示用，不儲存。以下為公開 MVP 規則摘要；本產品尚未正式對外上線，部分功能尚未開放，上線後以系統狀態與公告為準。';

export const PUBLIC_FAQ_ACCOUNT_FLOW_INTRO =
  '註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。';

export const PUBLIC_FAQ_ACCOUNT_FLOW_LOGIN_STEP =
  '完成註冊後請使用相同憑證到登入頁登入；登入才會在頁首顯示帳號名稱。';

export const PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP =
  '若需準備部分問卷的正式投票，可至個人資料頁填寫出生年月與居住地區；這不表示可保證符合或不符合任何問卷資格。';

export const PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP =
  '建立問卷頁預設為展示模式，送出僅做欄位檢查，資料不會儲存。';

export const PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP =
  '若要實際建立並管理問卷，請在網址加上 ?live=1（即時模式）。';

export const PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP =
  '建立成功後可至「我的問卷」管理已建立的問卷、分享投票連結；此頁僅管理你透過本站台建立流程所建立的問卷。';

export const PUBLIC_FAQ_PARTICIPANT_VOTE_STEP =
  '投票頁可閱讀問卷、選擇一個選項並送出。正式投票可能需要登入；送出當下由系統判定是否可計票。此說明不代表一定可以完成投票。';

export const PUBLIC_FAQ_PARTICIPANT_DEMO_STEP =
  '範例問卷（如 /vote/demo）僅展示流程，不儲存票數。';

export const PUBLIC_FAQ_PARTICIPANT_RESULTS_STEP =
  '公開結果頁（唯讀）可查看目前允許顯示的統計摘要，無法在此投票或編輯問卷。';

export const PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP = PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT;

export const PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE =
  '本機展示時，個人資料與投票頁可能使用測試身份示範，非正式登入；發起問卷請使用即時模式（?live=1）。正式上線後須透過已核准憑證登入與操作。';

export const PUBLIC_FAQ_PROFILE_FIELDS_PURPOSE_LEAD =
  '部分問卷僅限特定年齡區間或粗粒度地區的參與者參與正式投票。';

export const PUBLIC_FAQ_PROFILE_FIELDS_PURPOSE_BODY =
  '請在個人資料頁填寫出生年／月（不含日期）與粗粒度地區代碼（例如 TW-TPE）。資料只用於資格判斷，不對外公開個人投票紀錄，也不做公開統計分群展示。';

export const PUBLIC_FAQ_PROFILE_ELIGIBILITY_HINT =
  '部分正式投票可能在送出當下檢查出生年月與居住地區。若尚未填寫，可至個人資料頁補充；這不表示可保證符合或不符合任何問卷資格。';

export const PUBLIC_FAQ_COLLECTING_HIDDEN_LEAD =
  '收集中完全不顯示票數、百分比、總計、排名、趨勢或進度。';

export const PUBLIC_FAQ_COLLECTING_HIDDEN_PURPOSE =
  '目的是讓每位投票者不受已知數字影響，屬於產品設計，不是畫面故障。';

export const PUBLIC_FAQ_ELIGIBILITY_FAILURE_REFERENCE_NOTE =
  '試填作答目前不依個人資料欄位額外限制。';

export const PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY = PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT;

export const PUBLIC_HOME_VALUE_LOCK_PERIOD_BODY =
  '結果公開後約 5 天為公開鎖定期，期間不能下架或隱藏；結束後可下架。';

export const PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY =
  '投票後可協助回饋題目是否清楚易懂。部分問卷標題旁可能顯示「回饋良好」，僅表示回饋評價，不是分數、排名或推薦。';

export const PUBLIC_HOME_TRUST_COLLECTING_HIDDEN_ITEM = '收集中不顯示結果';

export const PUBLIC_HOME_TRUST_DEADLINE_REVEAL_ITEM = '截止即公開結果';

export const PUBLIC_HOME_TRUST_LOCK_PERIOD_ITEM = '公開鎖定期約 5 天';

export const PUBLIC_HOME_SAMPLE_POLLS_EXPLORE_LINK_LABEL = '探索問卷';

export const PUBLIC_HOME_SAMPLE_POLLS_SECTION_NOTE =
  '已列出最近發布、仍在收集中的公開問卷（依發布時間排序；非熱門、票數、個人化或榜單；不顯示票數與結果預覽）。下方卡片為靜態範例，僅供預覽各狀態文案。';

export const PUBLIC_HOME_STATIC_EXAMPLES_FOOTER_NOTE =
  '想認識各種問卷狀態？可在結果頁切換「收集中」「公開鎖定期」「已取消」等範例，或查看常見問題。';

export const PUBLIC_HOME_ACCOUNT_FLOW_FORMAL_LEAD = '正式帳號：';

export const PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE =
  '只建立帳號，不會自動登入';

export const PUBLIC_HOME_ACCOUNT_FLOW_LOGIN_NOTE =
  '登入後頁首才會顯示帳號名稱';

export const PUBLIC_HOME_DEMO_FLOW_LEAD = '本機 demo：';

export const PUBLIC_HOME_DEMO_CREATE_POLL_LINK_LABEL = '建立問卷（?live=1）';

export const PUBLIC_HOME_DEMO_CREATE_POLL_HREF = '/polls/new?live=1';

export const PUBLIC_HOME_PROFILE_HREF = '/profile';

export const PUBLIC_HOME_DEMO_CREATOR_SESSION_NOTE = '發起問卷請使用即時模式；';

export const PUBLIC_HOME_DEMO_PROFILE_VOTE_NOTE =
  '個人資料與投票可使用測試身份示範。';

export const PUBLIC_HOME_MANUAL_QA_DOC_NOTE =
  '測試順序見專案文件 public-mvp-manual-qa。';

export const PUBLIC_HOME_COLLECTING_CARD_TOOLTIP = PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT;

export const PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING = '收集中不公開結果';

export const PUBLIC_HOME_LOCK_PERIOD_CARD_HEADING = '公開鎖定期';

export const PUBLIC_HOME_QUALITY_FEEDBACK_CARD_HEADING = '投票後回饋題目品質';
