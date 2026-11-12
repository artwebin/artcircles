export interface TokenInfo {
  symbol: string;     // on-chain symbol, e.g. "XUSDC"
  contract: string;   // token contract account
  precision: number;
  label: string;      // what the UI shows next to amounts
}

export const TOKENS: Record<string, TokenInfo> = {
  XUSDC: { symbol: "XUSDC", contract: "xtokens", precision: 6, label: "USDC" },
  XMD: { symbol: "XMD", contract: "xmd.token", precision: 6, label: "XMD" },
};

export const DEFAULT_TOKEN = TOKENS.XUSDC;

// "0.500000 XMD" -> TOKENS.XMD. Unknown symbols fall back to XUSDC.
export function tokenOf(amount: string): TokenInfo {
  const symbol = amount?.trim().split(" ")[1];
  return (symbol ? TOKENS[symbol] : undefined) ?? DEFAULT_TOKEN;
}

export function formatQuantity(value: number, token: TokenInfo): string {
  return `${value.toFixed(token.precision)} ${token.symbol}`;
}
