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
 * Retrieves all on-chain events for multiple circles from Hyperion in a single query pass.
 * Returns a mapping of circleId -> CircleEvent[] sorted chronologically.
 */
export async function getCirclesEvents(
  circleIds: (string | number)[],
  options?: { afterIso?: string; createdSec?: number }
): Promise<Record<number, CircleEvent[]>> {
  const targetIds = new Set(circleIds.map((id) => String(id)));
  const eventsMap: Record<number, CircleEvent[]> = {};
  const completedAddedMap: Record<string, boolean> = {};

  for (const id of circleIds) {
    eventsMap[Number(id)] = [];
  }

  let afterParam = "";
  if (options?.afterIso) {
    afterParam = `&after=${encodeURIComponent(options.afterIso)}`;
  } else if (options?.createdSec && options.createdSec > 0) {
    const afterIso = new Date(options.createdSec * 1000).toISOString();
    afterParam = `&after=${encodeURIComponent(afterIso)}`;
  }

  const limit = 100;
  let skip = 0;
  let hasMore = true;
  const rawActions: any[] = [];

  try {
    while (hasMore) {
      const data = await fetchHyperionWithFailover(
        `/v2/history/get_actions?account=artcircles&filter=xtokens:transfer,artcircles:start&sort=asc&limit=${limit}&skip=${skip}${afterParam}`
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
    console.warn(`Failed to fetch circle actions from Hyperion:`, err);
    return eventsMap;
  }

  const payoutRegex = /^artcircles:\s*circle\s*(\d+),\s*round\s*(\d+)\s*payout$/i;
  const completedRegex = /^artcircles:\s*circle\s*(\d+)\s*completed,\s*deposit\s*refund\s*and\s*compensation$/i;

  for (const action of rawActions) {
    const act = action?.act;
    if (!act) continue;

    const timestamp = normalizeTimestamp(action["@timestamp"]);
    const trxId = action.trx_id || "";

    // 1. Started event
    if (act.account === "artcircles" && act.name === "start") {
      const circleIdStr = String(act.data?.id);
      if (targetIds.has(circleIdStr)) {
        const numId = Number(circleIdStr);
        eventsMap[numId] = eventsMap[numId] || [];
        eventsMap[numId].push({
          type: "started",
          trxId,
          timestamp,
        });
      }
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
      if (pMatch) {
        const circleIdStr = pMatch[1];
        if (targetIds.has(circleIdStr)) {
          const numId = Number(circleIdStr);
          const roundNum = parseInt(pMatch[2], 10);
          eventsMap[numId] = eventsMap[numId] || [];
          eventsMap[numId].push({
            type: "payout",
            round: roundNum,
            to: act.data.to,
            amount: act.data.quantity,
            trxId,
            timestamp,
          });
        }
        continue;
      }

      // Completed match (group multiple member refunds into 1 completed event per circle)
      const cMatch = memo.match(completedRegex);
      if (cMatch) {
        const circleIdStr = cMatch[1];
        if (targetIds.has(circleIdStr)) {
          const numId = Number(circleIdStr);
          if (!completedAddedMap[circleIdStr]) {
            completedAddedMap[circleIdStr] = true;
            eventsMap[numId] = eventsMap[numId] || [];
            eventsMap[numId].push({
              type: "completed",
              trxId,
              timestamp,
            });
          }
        }
        continue;
      }
    }
  }

  return eventsMap;
}

/**
 * Retrieves all on-chain events for circle `id` from Hyperion.
 * Pass `options.createdSec` (from circle.created) to restrict fetching from the circle creation timestamp onwards.
 * Returns sorted chronologically.
 */
export async function getCircleEvents(
  id: string | number,
  options?: { afterIso?: string; createdSec?: number }
): Promise<CircleEvent[]> {
  const map = await getCirclesEvents([id], options);
  return map[Number(id)] || [];
}

