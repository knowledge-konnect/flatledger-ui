/**
 * Opening Balance Types
 * One-time setup feature for migrating existing balances
 */

export interface OpeningBalanceStatus {
  isApplied: boolean;
  appliedAt: string | null;
  appliedBy: string | null;
}

export interface FlatBalance {
  flatPublicId: string;
  flatNo: string;
  ownerName: string;
  openingBalance: number;
}

export interface OpeningBalanceFlatItem {
  flatPublicId: string;
  amount: number;
}

export interface OpeningBalanceRequest {
  transactionDate: string; // YYYY-MM-DD
  society_opening_amount: number;
  items: OpeningBalanceFlatItem[];
}

export interface OpeningBalanceSubmitResponse {
  succeeded: boolean;
  message: string;
}

export interface OpeningBalanceSummary {
  societyBalance: number;
  totalOutstanding: number;
  totalAdvance: number;
  flatsWithBalance: number;
  totalFlats: number;
}
