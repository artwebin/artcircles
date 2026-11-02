import type { PayoutRow } from "./rpc";

// How a member settled a round that has already been paid out
export type RoundStatus = "paid" | "covered" | "unpaid" | "netted";

export function roundStatus(row: PayoutRow, account: string): RoundStatus {
  if (row.covered?.includes(account)) return "covered";
  if (row.unpaid?.includes(account)) return "unpaid";
  if (row.recipient === account && row.recipientMissed) return "netted";
  return "paid";
}

