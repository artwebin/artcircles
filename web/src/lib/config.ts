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
