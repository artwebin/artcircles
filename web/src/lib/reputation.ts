export type ReputationState = "defaulted" | "missed" | "reliable" | "new";

export interface ReputationData {
  account: string;
  completed: number;
  missed: number;
  defaulted: number;
}

export function getReputationState(completed: number, missed: number, defaulted: number): ReputationState {
  if (defaulted > 0) return "defaulted";
  if (missed > 0) return "missed";
  if (completed > 0) return "reliable";
  return "new";
}

export function getReputationCopy(c: number, m: number, d: number) {
  const state = getReputationState(c, m, d);

  switch (state) {
    case "defaulted": {
      const total = c + d;
      const circleWord = total === 1 ? "circle" : "circles";
      const thatCircles = d === 1 ? "In that circle" : "In those circles";
      return {
        state,
        sentence: `Defaulted in ${d} of ${total} ${circleWord}.`,
        line: `${thatCircles} the security deposit ran out and a missed payment became a debt. Counted from finished circles on chain.`,
      };
    }
    case "missed": {
      const circleWord = c === 1 ? "circle" : "circles";
      const paymentWord = m === 1 ? "payment" : "payments";
      return {
        state,
        sentence: `Completed ${c} ${circleWord}. Missed ${m} ${paymentWord}, covered by the deposit.`,
        line: "Counted from finished circles on chain. Each one is listed below, so you can check it.",
      };
    }
    case "reliable": {
      const circleWord = c === 1 ? "circle" : "circles";
      return {
        state,
        sentence: `Completed ${c} ${circleWord}. Never missed a payment.`,
        line: "Counted from finished circles on chain. Each one is listed below, so you can check it.",
      };
    }
    case "new":
    default:
      return {
        state: "new" as const,
        sentence: "New to XPR Circles",
        line: "No circles completed yet. The record starts when the first circle ends.",
      };
  }
}

// 6 deterministic muted avatar palettes as required by brief
export const AVATAR_PALETTES = [
  { bg: "#E4EEEA", text: "#0B5A4E" }, // brand subtle
  { bg: "#FBEFD6", text: "#7A5208" }, // pot subtle
  { bg: "#E8EEF5", text: "#1E4C7A" }, // soft blue
  { bg: "#EBF2F0", text: "#17493D" }, // deep sage
  { bg: "#EEF0EE", text: "#2E3A36" }, // soft slate
  { bg: "#F8ECE7", text: "#8A3C1E" }, // warm coral
];

export function getAvatarColor(account: string) {
  let hash = 0;
  for (let i = 0; i < account.length; i++) {
    hash = account.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}
