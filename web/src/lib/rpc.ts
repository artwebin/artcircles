export const RPC_ENDPOINTS = [
  "https://rpc.api.testnet.metalx.com",
  "https://proton-testnet.eoscafeblock.com",
];

async function fetchWithFailover(path: string, body: any) {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${endpoint}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      const data = await response.json();
      return data;
    } catch (e) {
      console.warn(`RPC endpoint ${endpoint} failed`, e);
      // Try next endpoint
    }
  }
  throw new Error("All RPC endpoints failed");
}

export async function getCircle(id: string) {
  const data = await fetchWithFailover("/v1/chain/get_table_rows", {
    code: "artcircles",
    scope: "artcircles",
    table: "circles",
    lower_bound: id,
    upper_bound: id,
    limit: 1,
    json: true,
  });
  return data.rows[0] || null;
}

export async function getMembers(id: string) {
  const data = await fetchWithFailover("/v1/chain/get_table_rows", {
    code: "artcircles",
    scope: id,
    table: "members",
    limit: 100, // max members is 50, so 100 is safe
    json: true,
  });
  return data.rows || [];
}

export async function getChainTime() {
  const data = await fetchWithFailover("/v1/chain/get_info", {});
  return new Date(data.head_block_time).getTime() / 1000;
}

export async function getCircles(limit = 20, reverse = true) {
  const data = await fetchWithFailover("/v1/chain/get_table_rows", {
    code: "artcircles",
    scope: "artcircles",
    table: "circles",
    limit,
    reverse,
    json: true,
  });
  return data.rows || [];
}

export async function getMyCircles(account: string) {
  const circles = await getCircles(100, true);
  const circlesWithMembers = await Promise.all(
    circles.map(async (circle: any) => {
      try {
        const members = await getMembers(String(circle.id));
        const myMember = members.find((m: any) => m.account === account);
        const isOrganizer = circle.organizer === account;
        return {
          ...circle,
          membersList: members,
          myMember,
          isOrganizer,
          isMember: !!myMember,
        };
      } catch (e) {
        return {
          ...circle,
          membersList: [],
          myMember: null,
          isOrganizer: circle.organizer === account,
          isMember: false,
        };
      }
    })
  );

  return circlesWithMembers.filter((c: any) => c.isMember || c.isOrganizer);
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


