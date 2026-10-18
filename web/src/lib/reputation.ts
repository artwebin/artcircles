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

// Deterministic member avatar tones matching blue, purple, rust, slate from CircleRing.tsx
// Gold and green are reserved for the pot and the current user.
export const AVATAR_PALETTES = [
  { bg: "#DCE8F2", text: "#1F4E8C" }, // blue (modra)
  { bg: "#E9E1F3", text: "#5B3F8F" }, // purple (vijolična)
  { bg: "#F3E3DC", text: "#8A3B1C" }, // rust (rjava)
  { bg: "#E3E7EC", text: "#3E4A57" }, // slate (siva)
];

export function getAvatarColor(account: string) {
  let hash = 0;
  for (let i = 0; i < account.length; i++) {
    hash = account.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * Validates and normalizes on-chain avatar from usersinfo.avatar.
 * Supports:
 * 1. https:// URLs (rejects http://, javascript:, and all other schemes)
 * 2. Base64 data (PNG, JPEG, WebP, GIF up to 200 KB in binary bytes, rejects SVG)
 */
export function getValidAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar || typeof avatar !== "string") return null;
  const trimmed = avatar.trim();
  if (!trimmed) return null;

  // 1. HTTPS URL support
  if (trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "https:") {
        return trimmed;
      }
    } catch (e) {
      return null;
    }
  }

  // Reject all other URL schemes explicitly
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !trimmed.startsWith("data:image/")) {
    return null;
  }

  // 2. Base64 support
  let base64Data = trimmed;
  let mime: "png" | "jpeg" | "webp" | "gif" | null = null;

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i);
    if (!match) return null; // rejects SVG, xml, etc.
    mime = match[1].toLowerCase() === "jpg" ? "jpeg" : (match[1].toLowerCase() as any);
    base64Data = trimmed.slice(match[0].length);
  }

  // Size limit: 200 KB binary = 204,800 bytes
  const binaryByteLength = Math.floor((base64Data.length * 3) / 4);
  if (binaryByteLength > 200 * 1024) return null;

  // Detect magic bytes if mime wasn't explicitly given in data URI
  if (!mime) {
    if (base64Data.startsWith("/9j/")) {
      mime = "jpeg";
    } else if (base64Data.startsWith("iVBORw0KGgo")) {
      mime = "png";
    } else if (base64Data.startsWith("R0lGOD")) {
      mime = "gif";
    } else if (base64Data.startsWith("UklGR")) {
      mime = "webp";
    }
  }

  if (!mime) return null;
  return `data:image/${mime};base64,${base64Data}`;
}

export function isBase64Avatar(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("data:image/");
}

