const DEFAULT_TESTNET_ENDPOINTS = [
  "https://rpc.api.testnet.metalx.com",
  "https://proton-testnet.eoscafeblock.com",
  "https://test.proton.eosusa.io",
  "https://tn1.protonnz.com",
  "https://api-xprnetwork-test.saltant.io",
];

const DEFAULT_MAINNET_ENDPOINTS = [
  "https://rpc.api.metalx.com",
  "https://proton.eoscafeblock.com",
  "https://proton.eosusa.io",
  "https://xpr.cryptolions.io",
];

function getRpcEndpoints(): string[] {
  return process.env.NEXT_PUBLIC_CHAIN === "mainnet" ? DEFAULT_MAINNET_ENDPOINTS : DEFAULT_TESTNET_ENDPOINTS;
}

export const RPC_ENDPOINTS = getRpcEndpoints();

const rpcCache = new Map<string, { data: any; expiry: number }>();

export function clearRpcCache() {
  rpcCache.clear();
}

export interface QueryOptions {
  fresh?: boolean;
}

async function fetchWithFailover(path: string, body: any, ttlMs = 10000) {
  const cacheKey = `${path}:${JSON.stringify(body)}`;
  if (ttlMs > 0) {
    const cached = rpcCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window === "undefined") {
    headers["User-Agent"] = "XPRCircles/1.0 (+https://circles.artwebin.com)";
  }

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${endpoint}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // On rate-limit or service-unavailable, immediately switch to next endpoint
      if (response.status === 429 || response.status === 503) {
        console.warn(`RPC endpoint ${endpoint} returned ${response.status}, switching immediately`);
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      const data = await response.json();
      if (ttlMs > 0) {
        rpcCache.set(cacheKey, { data, expiry: Date.now() + ttlMs });
      }
      return data;
    } catch (e) {
      console.warn(`RPC endpoint ${endpoint} failed`, e);
      // Try next endpoint
    }
  }
  throw new Error("All RPC endpoints failed");
}

export interface GetAllRowsParams {
  code: string;
  scope: string | number;
  table: string;
  lower_bound?: string | number;
  upper_bound?: string | number;
  limit?: number;
  key_type?: string;
  index_position?: string | number;
  reverse?: boolean;
  json?: boolean;
}

/**
 * Paginates through a contract table until more: false using next_key as lower_bound.
 */
export async function getAllRows<T = any>(
  params: GetAllRowsParams,
  batchLimit = 100,
  ttlMs = 10000
): Promise<T[]> {
  const allRows: T[] = [];
  let lowerBound = params.lower_bound ?? 0;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWithFailover(
      "/v1/chain/get_table_rows",
      {
        ...params,
        scope: String(params.scope),
        limit: batchLimit,
        lower_bound: lowerBound,
        json: true,
      },
      ttlMs
    );

    const rows: T[] = data?.rows || [];
    if (rows.length === 0) break;

    for (const r of rows) {
      allRows.push(r);
    }

    if (data.more && data.next_key && String(data.next_key) !== String(lowerBound)) {
      lowerBound = data.next_key;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

export async function getCircle(id: string, options?: QueryOptions) {
  const ttlMs = options?.fresh ? 0 : 10000;
  const data = await fetchWithFailover(
    "/v1/chain/get_table_rows",
    {
      code: "artcircles",
      scope: "artcircles",
      table: "circles",
      lower_bound: id,
      upper_bound: id,
      limit: 1,
      json: true,
    },
    ttlMs
  );
  return data.rows[0] || null;
}

export async function getMembers(id: string, options?: QueryOptions) {
  const ttlMs = options?.fresh ? 0 : 10000;
  return getAllRows(
    {
      code: "artcircles",
      scope: id,
      table: "members",
    },
    100,
    ttlMs
  );
}

export interface MembershipRow {
  circle: number;
  organizer: boolean;
  member: boolean;
}

export async function getMemberships(account: string, options?: QueryOptions): Promise<MembershipRow[]> {
  const ttlMs = options?.fresh ? 0 : 10000;
  return getAllRows<MembershipRow>(
    {
      code: "artcircles",
      scope: account,
      table: "memberships",
    },
    100,
    ttlMs
  );
}

export async function getChainTime() {
  const data = await fetchWithFailover("/v1/chain/get_info", {});
  return new Date(data.head_block_time).getTime() / 1000;
}


/**
 * Reads circles for account via the memberships table (scope = account),
 * and fetches each circle and member list in parallel.
 */
export async function getMyCircles(account: string, options?: QueryOptions) {
  const memberships = await getMemberships(account, options);
  if (memberships.length === 0) {
    return [];
  }

  const circlesWithMembers = await Promise.all(
    memberships.map(async (m) => {
      const circleId = String(m.circle);
      try {
        const [circle, members] = await Promise.all([
          getCircle(circleId, options),
          getMembers(circleId, options),
        ]);

        if (!circle) return null;

        const myMember = members.find((mem: any) => mem.account === account);
        const isOrganizer = Boolean(m.organizer) || circle.organizer === account;

        return {
          ...circle,
          membersList: members,
          myMember,
          isOrganizer,
          isMember: Boolean(m.member) || !!myMember,
        };
      } catch (e) {
        console.warn(`Failed to fetch circle #${circleId} for account ${account}`, e);
        return null;
      }
    })
  );

  return circlesWithMembers
    .filter((c): c is NonNullable<typeof c> => c !== null && (c.isMember || c.isOrganizer))
    .sort((a, b) => Number(b.id) - Number(a.id));
}

export async function getReputation(account: string) {
  const data = await fetchWithFailover("/v1/chain/get_table_rows", {
    code: "artcircles",
    scope: "artcircles",
    table: "reputation",
    lower_bound: account,
    upper_bound: account,
    limit: 1,
    json: true,
  });
  return data.rows[0] || {
    account,
    completed: 0,
    missed: 0,
    defaulted: 0,
  };
}

export async function getAccountInfo(account: string) {
  try {
    const data = await fetchWithFailover("/v1/chain/get_table_rows", {
      code: "eosio.proton",
      scope: "eosio.proton",
      table: "usersinfo",
      lower_bound: account,
      upper_bound: account,
      limit: 1,
      json: true,
    });
    return data.rows[0] || null;
  } catch (e) {
    return null;
  }
}

export async function getXusdcBalance(account: string): Promise<number> {
  try {
    const data = await fetchWithFailover("/v1/chain/get_table_rows", {
      code: "xtokens",
      scope: account,
      table: "accounts",
      limit: 100,
      json: true,
    });
    const row = (data.rows || []).find((r: any) => r.balance && r.balance.endsWith("XUSDC"));
    if (!row) return 0;
    return parseFloat(row.balance.split(" ")[0]);
  } catch (e) {
    console.warn("Failed to fetch XUSDC balance", e);
    return 0;
  }
}

export async function getChainAccount(account: string): Promise<{ exists: boolean; created: string | null }> {
  const cacheKey = `get_account:${account}`;
  const cached = rpcCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  let lastError: any = null;

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (typeof window === "undefined") {
        headers["User-Agent"] = "XPRCircles/1.0 (+https://circles.artwebin.com)";
      }
      const response = await fetch(`${endpoint}/v1/chain/get_account`, {
        method: "POST",
        headers,
        body: JSON.stringify({ account_name: account }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 429 || response.status === 503) {
        lastError = new Error(`Endpoint ${endpoint} returned status ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (e) {
          // not json
        }
      }

      // Check if node returned unknown key / account_query_exception
      const isUnknownAccount =
        data?.error?.name === "account_query_exception" ||
        (typeof data?.message === "string" && data.message.includes("unknown key")) ||
        (data?.error?.details &&
          Array.isArray(data.error.details) &&
          data.error.details.some(
            (d: any) =>
              typeof d.message === "string" &&
              (d.message.includes("unknown key") || d.message.includes("account_query_exception"))
          ));

      if (isUnknownAccount) {
        const res = { exists: false, created: null };
        rpcCache.set(cacheKey, { data: res, expiry: Date.now() + 10000 });
        return res;
      }

      if (response.ok && data && data.account_name === account) {
        const res = { exists: true, created: data.created || null };
        rpcCache.set(cacheKey, { data: res, expiry: Date.now() + 10000 });
        return res;
      }

      lastError = new Error(`Endpoint ${endpoint} returned status ${response.status}`);
    } catch (e: any) {
      lastError = e;
      // try next endpoint
    }
  }

  // All endpoints failed or returned other errors - do NOT cache negative result!
  throw lastError || new Error("Could not reach XPR Network");
}


