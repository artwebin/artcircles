// artcircles keeper
//
// Watches active circles and triggers `payout` when every member has paid
// or the round deadline has passed. Anyone can run a keeper: `payout` needs
// no special authority, so circles never depend on a single operator.
//
// The keeper account should use a dedicated permission linked only to
// artcircles::payout. A leaked key can then do nothing but trigger payouts.

import { Api, JsonRpc, JsSignatureProvider } from "@proton/js";

const STATE_ACTIVE = 1;

export function decide(circle, members, now) {
  if (circle.state !== STATE_ACTIVE) return { action: "skip", reason: "not active" };
  const unpaid = members.filter((m) => m.paidRound !== circle.round).map((m) => m.account);
  const deadline = circle.roundStart + circle.periodSec;
  if (unpaid.length === 0) return { action: "payout", reason: "all members paid" };
  if (now >= deadline) return { action: "payout", reason: `deadline passed, unpaid: ${unpaid.join(", ")}` };
  return { action: "wait", reason: `waiting for ${unpaid.join(", ")}, deadline in ${formatDuration(deadline - now)}` };
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function log(level, msg) {
  console.log(`${new Date().toISOString()} ${level.padEnd(5)} ${msg}`);
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    log("error", `missing environment variable ${name}`);
    process.exit(1);
  }
  return v;
}

async function getAllRows(rpc, code, scope, table) {
  const rows = [];
  let lower = "";
  for (;;) {
    const res = await rpc.get_table_rows({ json: true, code, scope, table, lower_bound: lower, limit: 100 });
    rows.push(...res.rows);
    if (!res.more || !res.next_key) break;
    lower = res.next_key;
  }
  return rows;
}

async function chainTime(rpc) {
  const info = await rpc.get_info();
  return Math.floor(new Date(info.head_block_time + "Z").getTime() / 1000);
}

async function main() {
  const contract = requireEnv("CONTRACT");
  const account = requireEnv("KEEPER_ACCOUNT");
  const permission = requireEnv("KEEPER_PERMISSION");
  const privateKey = requireEnv("KEEPER_PRIVATE_KEY");
  const endpoints = requireEnv("RPC_ENDPOINTS").split(",").map((e) => e.trim()).filter(Boolean);
  const pollSeconds = Number(process.env.POLL_SECONDS || 60);
  const dryRun = process.env.DRY_RUN === "1";

  const rpc = new JsonRpc(endpoints);
  const api = new Api({ rpc, signatureProvider: new JsSignatureProvider([privateKey]) });

  // Rounds we already paid out, so a lagging node does not make us retry the same round
  const done = new Map();
  // Failed attempts, so we back off instead of hammering the chain
  const failedUntil = new Map();

  let running = true;
  const stop = () => { running = false; log("info", "shutting down"); };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  log("info", `keeper started: ${account}@${permission} on ${contract}, poll ${pollSeconds}s${dryRun ? ", DRY RUN" : ""}`);

  while (running) {
    try {
      const now = await chainTime(rpc);
      const circles = (await getAllRows(rpc, contract, contract, "circles")).filter((c) => c.state === STATE_ACTIVE);

      for (const circle of circles) {
        const key = `${circle.id}:${circle.round}`;
        if (done.has(key)) continue;
        if ((failedUntil.get(key) || 0) > now) continue;

        const members = await getAllRows(rpc, contract, String(circle.id), "members");
        const d = decide(circle, members, now);
        if (d.action !== "payout") {
          log("info", `circle ${circle.id} round ${circle.round}: ${d.reason}`);
          continue;
        }

        if (dryRun) {
          log("info", `circle ${circle.id} round ${circle.round}: would pay out (${d.reason})`);
          continue;
        }

        try {
          const res = await api.transact(
            { actions: [{
              account: contract,
              name: "payout",
              authorization: [{ actor: account, permission }],
              data: { id: circle.id },
            }] },
            { blocksBehind: 3, expireSeconds: 60 }
          );
          done.set(key, now);
          log("info", `circle ${circle.id} round ${circle.round}: paid out (${d.reason}), tx ${res.transaction_id}`);
        } catch (e) {
          failedUntil.set(key, now + 300);
          log("error", `circle ${circle.id} round ${circle.round}: payout failed, retry in 5m: ${e.message}`);
        }
      }

      // Forget old entries
      for (const [k, t] of done) if (now - t > 86400) done.delete(k);
      for (const [k, t] of failedUntil) if (t < now) failedUntil.delete(k);
    } catch (e) {
      log("error", `poll failed: ${e.message}`);
    }

    for (let i = 0; i < pollSeconds && running; i++) await new Promise((r) => setTimeout(r, 1000));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
