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
  "https://api-xprnetwork-test.saltant.io",
];

export const HYPERION_ENDPOINTS: string[] =
  CHAIN === "mainnet" ? DEFAULT_MAINNET_HYPERION_ENDPOINTS : DEFAULT_TESTNET_HYPERION_ENDPOINTS;

export interface ProofEventConfig {
  circle: number;
  type: "completed" | "payout";
  round?: number;
  title: string;
  text: string;
}

export const PROOF_EVENTS: readonly ProofEventConfig[] = [
  {
    circle: 0,
    type: "completed",
    title: "Circle #0 completed",
    text: "Three members, three rounds, everyone paid on time. Each received the pot once and got their deposit back.",
  },
  {
    circle: 1,
    type: "payout",
    round: 1,
    title: "Circle #1, round 1 paid out",
    text: "One member missed the deadline. Their deposit covered it and the pot was paid in full.",
  },
  {
    circle: 1,
    type: "payout",
    round: 2,
    title: "Circle #1, round 2 paid out",
    text: "The same member missed again with no deposit left. It was recorded as their debt, and that round's pot was smaller.",
  },
  {
    circle: 1,
    type: "completed",
    title: "Circle #1 completed",
    text: "The debt was held back from that member's own pot and paid to the member who got less. All three ended with exactly 100.00.",
  },
] as const;
