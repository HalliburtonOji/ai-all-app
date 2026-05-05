export type MarketplaceListingStatus =
  | "draft"
  | "active"
  | "paused"
  | "closed";

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  body: string | null;
  price_text: string | null;
  tags: string[];
  status: MarketplaceListingStatus;
  created_at: string;
  updated_at: string;
}

export const MAX_TITLE_LENGTH = 120;
export const MAX_SUMMARY_LENGTH = 600;
export const MAX_BODY_LENGTH = 4000;
export const MAX_PRICE_TEXT_LENGTH = 80;
export const MAX_LISTING_TAGS = 8;
export const MAX_LISTING_TAG_LENGTH = 30;

export const STATUS_LABEL: Record<MarketplaceListingStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
};
