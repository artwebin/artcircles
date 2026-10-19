/**
 * Global configuration constants for XPR Circles
 */

export const PROOF_CIRCLE_ID = 1;

export const CHAIN = process.env.NEXT_PUBLIC_CHAIN === "mainnet" ? "mainnet" : "testnet";

export const EXPLORER_URL =
  CHAIN === "mainnet"
    ? "https://explorer.xprnetwork.org"
    : "https://testnet.explorer.xprnetwork.org";
