/**
 * Global configuration constants for XPR Circles
 */

export const PROOF_CIRCLE_ID = 1;

export const CHAIN = process.env.NEXT_PUBLIC_CHAIN === "mainnet" ? "mainnet" : "testnet";

export const EXPLORER_URL =
  CHAIN === "mainnet"
    ? "https://explorer.xprnetwork.org"
    : "https://testnet.explorer.xprnetwork.org";

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
  { circle: 0, type: "completed", title: "Circle #0 completed",
    text: "Three members, three rounds, everyone paid on time. Each received the pot once and got their deposit back.",
    timestamp: "2026-10-05T07:13:34.500Z", trxId: "c68da20b4b66346995816823c0be83be5b34ece17b540adf78156ff6bf2d1a02" },
  { circle: 1, type: "payout", round: 1, title: "Circle #1, round 1 paid out",
    text: "One member missed the deadline. Their deposit covered it and the pot was paid in full.",
    timestamp: "2026-10-06T07:27:07.500Z", trxId: "1938b7ea35973765581865baa5dfb54bd13b2f60315cdb7bdfc8bab87028996c" },
  { circle: 1, type: "payout", round: 2, title: "Circle #1, round 2 paid out",
    text: "The same member missed again with no deposit left. It was recorded as their debt, and that round's pot was smaller.",
    timestamp: "2026-10-07T07:26:18.000Z", trxId: "180c54e003e14b353dcc510a1113012032e3bcb8045e64c297796d9a28cf9f09" },
  { circle: 1, type: "completed", title: "Circle #1 completed",
    text: "The debt was held back from that member's own pot and paid to the member who got less. All three ended with exactly 100.00.",
    timestamp: "2026-10-08T07:26:40.000Z", trxId: "0be42ee2b982691b4bce719a79238bda83fd1d2f8b18317b2ae6f4c4b002d01e" },
] as const;
