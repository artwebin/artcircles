/**
 * Global configuration constants for XPR Circles
 */

export const PROOF_CIRCLE_ID = 7;

export const CHAIN = process.env.NEXT_PUBLIC_CHAIN === "mainnet" ? "mainnet" : "testnet";

export const EXPLORER_URL =
  CHAIN === "mainnet"
    ? "https://explorer.xprnetwork.org"
    : "https://testnet.explorer.xprnetwork.org";

export const CONTRACT = "artcircles";

export const contractExplorerUrl = () =>
  `${EXPLORER_URL}/account/${CONTRACT}?loadContract=true&tab=Tables&table=circles` +
  `&account=${CONTRACT}&scope=${CONTRACT}&limit=100`;

export const circleExplorerUrl = (id: number | string) =>
  `${EXPLORER_URL}/account/${CONTRACT}?loadContract=true&tab=Tables&table=circles` +
  `&account=${CONTRACT}&scope=${CONTRACT}&limit=1&lower_bound=${id}&upper_bound=${id}`;

export const CHAIN_ID =
  CHAIN === "mainnet"
    ? "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0"
    : "71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd";

const DEFAULT_MAINNET_HYPERION_ENDPOINTS = [
  "https://proton.eosusa.io",
  "https://proton.protonuk.io",
  "https://proton-api.eosiomadrid.io",
  "https://api-xprnetwork-main.saltant.io",
  "https://xpr-mainnet-api.bloxprod.io",
  "https://proton-hyperion.luminaryvisn.com",
];

const DEFAULT_TESTNET_HYPERION_ENDPOINTS = [
  "https://test.proton.eosusa.io",
];

export const HYPERION_ENDPOINTS: string[] =
  CHAIN === "mainnet" ? DEFAULT_MAINNET_HYPERION_ENDPOINTS : DEFAULT_TESTNET_HYPERION_ENDPOINTS;

export interface ProofEventConfig {
  circle: number;
  type: "completed" | "payout";
  round?: number;
  title: string;
  text: string;
  timestamp: string;
  trxId: string;
}

export const PROOF_EVENTS = [
  { circle: 7, type: "payout", round: 2, title: "Circle #7, round 2 paid out",
    text: "One member missed the deadline. Their deposit covered the payment, and the pot was paid in full: 50.00.",
    timestamp: "2026-11-14T22:34:10.000Z", trxId: "146c814206e723570d376f11fa6c8d9e9ab4e06388b7c248ae36cf25ad3b3457" },
  { circle: 7, type: "payout", round: 3, title: "Circle #7, round 3 paid out",
    text: "That member was next to receive the pot. 10.00 refilled their deposit first, and the remaining 40.00 was sent to them.",
    timestamp: "2026-11-15T18:50:53.000Z", trxId: "a24bdbc3f3f6a42dd0f9ed342519514d81ddde90c389980018b41f852f93f73d" },
  { circle: 7, type: "payout", round: 4, title: "Circle #7, round 4 paid out",
    text: "Everyone paid on time, and the pot was paid out within a minute of the last payment.",
    timestamp: "2026-11-16T21:20:15.000Z", trxId: "842ee052367e3795e72b3722718845fb57c8f654ed9e3c248d5af3dac70c1d18" },
  { circle: 7, type: "completed", title: "Circle #7 completed",
    text: "Nobody paid the last round. The deposits covered it, so the last member received 40.00 plus their own deposit back. All five members ended with exactly the balance they started with.",
    timestamp: "2026-11-17T22:33:36.000Z", trxId: "2af717e0580319e7bdb6371060f8ea5b8d90e7a1d5faa8092aa30ca990ec700d" },
] as const;
