import "server-only";
import { HYPERION_ENDPOINTS } from "./config";

export interface CircleEvent {
  type: "started" | "payout" | "completed";
  round?: number;
  to?: string;
  amount?: string;
  trxId: string;
  timestamp: string; // ISO string guaranteed to end with 'Z'
}

function normalizeTimestamp(raw?: string): string {
  if (!raw || typeof raw !== "string") {
    return new Date().toISOString();
  }
  return raw.endsWith("Z") ? raw : `${raw}Z`;
}

/**
 * Fetches JSON from Hyperion with automatic failover and polite timeout/headers.
 */
async function fetchHyperionWithFailover(path: string): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "XPRCircles/1.0 (+https://circles.artwebin.com)",
  };

  let lastError: any = null;

  for (const endpoint of HYPERION_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `${endpoint.replace(/\/+$/, "")}${path}`;
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        next: { revalidate: 300 }, // Cache on server for 5 minutes
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from ${endpoint}`);
        continue;
      }

      const json = await response.json();
      return json;
    } catch (e) {
      lastError = e;
      continue;
    }
  }

  console.warn("All Hyperion endpoints failed for query:", path, lastError);
  return null;
}

/**
 * Retrieves all on-chain events for circle `id` from Hyperion.
 * Returns sorted chronologically.
 */
export async function getCircleEvents(id: string | number): Promise<CircleEvent[]> {
  const targetId = String(id);
  const limit = 100;
  let skip = 0;
  let hasMore = true;
  const rawActions: any[] = [];

  try {
    while (hasMore) {
      const data = await fetchHyperionWithFailover(
        `/v2/history/get_actions?account=artcircles&filter=xtokens:transfer,artcircles:start&sort=asc&limit=${limit}&skip=${skip}`
      );

      const actions = data?.actions;
      if (!Array.isArray(actions) || actions.length === 0) {
        break;
      }

      rawActions.push(...actions);

      if (actions.length < limit || rawActions.length >= 1000) {
        hasMore = false;
      } else {
        skip += limit;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch circle #${targetId} actions from Hyperion:`, err);
    return [];
  }

  const events: CircleEvent[] = [];
  let completedAdded = false;

  const payoutRegex = /^artcircles:\s*circle\s*(\d+),\s*round\s*(\d+)\s*payout$/i;
  const completedRegex = /^artcircles:\s*circle\s*(\d+)\s*completed,\s*deposit\s*refund\s*and\s*compensation$/i;

  for (const action of rawActions) {
    const act = action?.act;
    if (!act) continue;

    const timestamp = normalizeTimestamp(action["@timestamp"]);
    const trxId = action.trx_id || "";

    // 1. Started event
    if (
      act.account === "artcircles" &&
      act.name === "start" &&
      String(act.data?.id) === targetId
    ) {
      events.push({
        type: "started",
        trxId,
        timestamp,
      });
      continue;
    }

    // 2. Transfer events from artcircles (payout or completed refund)
    if (
      act.account === "xtokens" &&
      act.name === "transfer" &&
      act.data?.from === "artcircles"
    ) {
      const memo = String(act.data?.memo || "").trim();

      // Payout match
      const pMatch = memo.match(payoutRegex);
      if (pMatch && pMatch[1] === targetId) {
        const roundNum = parseInt(pMatch[2], 10);
        events.push({
          type: "payout",
          round: roundNum,
          to: act.data.to,
          amount: act.data.quantity,
          trxId,
          timestamp,
        });
        continue;
      }

      // Completed match (group multiple member refunds into 1 completed event)
      const cMatch = memo.match(completedRegex);
      if (cMatch && cMatch[1] === targetId) {
        if (!completedAdded) {
          completedAdded = true;
          events.push({
            type: "completed",
            trxId,
            timestamp,
          });
        }
        continue;
      }
    }
  }

  return events;
}
