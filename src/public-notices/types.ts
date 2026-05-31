export type PublicNoticeRow = {
  id: string;
  poll_id: string;
  notice_type: string;
  title: string;
  body: string;
  created_at: Date;
};

export type PublicNotice = {
  notice_id: string;
  poll_id: string;
  notice_type: string;
  title: string;
  body: string;
  created_at: string;
};

export type PublicNoticeList = {
  notices: PublicNotice[];
};
