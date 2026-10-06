// artcircles notifier
//
// Telegram reminders for savings circles. Read only: it never signs anything
// and never asks users to sign, send or share anything. Everything it reports
// is already public on chain, so anyone may follow any account (for example an
// organizer following a family member who does not use Telegram).

import { JsonRpc } from "@proton/js";
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildSnapshot, computeEvents, formatAsset, formatUtc } from "./events.mjs";

const MAX_WATCHES_PER_CHAT = 10;
const ACCOUNT_RE = /^[a-z1-5.]{1,12}$/;
const STATE_NAMES = ["forming", "active", "completed", "cancelled"];

const HELP =
  "artcircles reminders\n\n" +
  "/watch <account> - get reminders for an XPR account\n" +
  "/unwatch <account> - stop reminders\n" +
  "/list - watched accounts and their circles\n\n" +
  "This bot only sends information. It will never ask you to sign anything, send funds, or share keys. " +
  "Anything that does is not artcircles.";

function log(level, msg) {
  console.log(`${new Date().toISOString()} ${level.padEnd(5)} ${msg}`);
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) { log("error", `missing environment variable ${name}`); process.exit(1); }
  return v;
}

// ---------- persistent state ----------

function loadState(file) {
  if (!existsSync(file)) return { offset: 0, subs: {}, sent: {}, snap: null };
  return JSON.parse(readFileSync(file, "utf8"));
}

function saveState(file, state) {
  const tmp = file + ".tmp";
  writeFileSync(tmp, JSON.stringify(state), { mode: 0o600 });
  renameSync(tmp, file);
}

// ---------- chain ----------

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

async function readCircles(rpc, contract) {
  // Completed and cancelled circles are only needed for the transition into that state
  const circles = await getAllRows(rpc, contract, contract, "circles");
  const membersByCircle = {};
  for (const c of circles) {
    membersByCircle[c.id] = await getAllRows(rpc, contract, String(c.id), "members");
  }
  return { circles, membersByCircle };
}

// ---------- telegram ----------

class Telegram {
  constructor(token, api = "https://api.telegram.org") { this.base = `${api}/bot${token}`; }

  async call(method, body) {
    const res = await fetch(`${this.base}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      const err = new Error(data.description || `telegram ${method} failed`);
      err.code = data.error_code;
      err.retryAfter = data.parameters && data.parameters.retry_after;
      throw err;
    }
    return data.result;
  }

  send(chatId, text) {
    return this.call("sendMessage", { chat_id: chatId, text, disable_web_page_preview: true });
  }
}

// ---------- main ----------

async function main() {
  const token = requireEnv("TELEGRAM_TOKEN");
  const contract = requireEnv("CONTRACT");
  const endpoints = requireEnv("RPC_ENDPOINTS").split(",").map((e) => e.trim()).filter(Boolean);
  const dataDir = requireEnv("DATA_DIR");
  const pollSeconds = Number(process.env.POLL_SECONDS || 60);

  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const stateFile = join(dataDir, "notifier.json");
  const state = loadState(stateFile);
  const save = () => saveState(stateFile, state);

  const rpc = new JsonRpc(endpoints);
  const tg = new Telegram(token, process.env.TELEGRAM_API || undefined);
  let latest = { circles: [], membersByCircle: {} };
  let running = true;

  const stop = () => { running = false; log("info", "shutting down"); };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  async function deliver(chatId, text) {
    try {
      await tg.send(chatId, text);
    } catch (e) {
      if (e.code === 403) {
        // The user blocked the bot: forget the chat
        delete state.subs[chatId];
        log("info", `chat ${chatId} blocked the bot, subscriptions removed`);
      } else if (e.retryAfter) {
        await new Promise((r) => setTimeout(r, e.retryAfter * 1000));
        await tg.send(chatId, text);
      } else {
        throw e;
      }
    }
  }

  function circlesOf(account) {
    const out = [];
    for (const c of latest.circles) {
      const m = (latest.membersByCircle[c.id] || []).find((x) => x.account === account);
      if (m || c.organizer === account) out.push({ c, m });
    }
    return out;
  }

  async function handleCommand(chatId, text) {
    const [cmd, arg] = text.trim().split(/\s+/, 2);
    const command = cmd.toLowerCase().split("@")[0];
    const subs = state.subs[chatId] || [];

    if (command === "/start" || command === "/help") return deliver(chatId, HELP);

    if (command === "/watch" || command === "/unwatch") {
      const account = (arg || "").toLowerCase();
      if (!ACCOUNT_RE.test(account)) return deliver(chatId, `Usage: ${command} <account>`);

      if (command === "/unwatch") {
        state.subs[chatId] = subs.filter((a) => a !== account);
        if (state.subs[chatId].length === 0) delete state.subs[chatId];
        save();
        return deliver(chatId, `Stopped reminders for ${account}.`);
      }

      if (subs.includes(account)) return deliver(chatId, `Already watching ${account}.`);
      if (subs.length >= MAX_WATCHES_PER_CHAT) return deliver(chatId, `You can watch up to ${MAX_WATCHES_PER_CHAT} accounts.`);
      try {
        await rpc.get_account(account);
      } catch {
        return deliver(chatId, `Account ${account} does not exist.`);
      }
      state.subs[chatId] = [...subs, account];
      save();
      const n = circlesOf(account).length;
      return deliver(chatId, `Watching ${account}. ${n === 0 ? "No circles yet." : `Member of ${n} circle(s), see /list.`}`);
    }

    if (command === "/list") {
      if (subs.length === 0) return deliver(chatId, "You are not watching any account. Use /watch <account>.");
      const lines = [];
      for (const account of subs) {
        lines.push(`${account}`);
        const cs = circlesOf(account);
        if (cs.length === 0) lines.push("  no circles");
        for (const { c, m } of cs) {
          let line = `  #${c.id} "${c.name}": ${STATE_NAMES[c.state] || c.state}, ${formatAsset(c.amount)} per round`;
          if (c.state === 1) {
            line += `, round ${c.round} of ${c.members}`;
            if (m) line += m.paidRound === c.round ? ", paid" : `, not paid, deadline ${formatUtc(c.roundStart + c.periodSec)}`;
          }
          lines.push(line);
        }
      }
      return deliver(chatId, lines.join("\n"));
    }

    return deliver(chatId, HELP);
  }

  async function telegramLoop() {
    while (running) {
      try {
        const updates = await tg.call("getUpdates", { offset: state.offset, timeout: 25, allowed_updates: ["message"] });
        for (const u of updates) {
          state.offset = u.update_id + 1;
          const msg = u.message;
          if (msg && msg.text && msg.chat && msg.chat.type === "private") {
            await handleCommand(String(msg.chat.id), msg.text).catch((e) => log("error", `command failed: ${e.message}`));
          }
        }
        if (updates.length) save();
      } catch (e) {
        log("error", `telegram poll failed: ${e.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  async function chainLoop() {
    while (running) {
      try {
        const now = await chainTime(rpc);
        latest = await readCircles(rpc, contract);
        const events = computeEvents({ prev: state.snap, ...latest, now });

        // Which chats watch which account
        const watchers = {};
        for (const [chatId, accounts] of Object.entries(state.subs)) {
          for (const a of accounts) (watchers[a] = watchers[a] || []).push(chatId);
        }

        let sent = 0;
        for (const ev of events) {
          for (const chatId of watchers[ev.account] || []) {
            const key = `${chatId}|${ev.key}`;
            if (state.sent[key]) continue;
            if (ev.text) {
              const prefix = (state.subs[chatId] || []).length > 1 ? `[${ev.account}] ` : "";
              await deliver(chatId, prefix + ev.text);
              sent++;
            }
            state.sent[key] = now;
          }
        }

        // Forget delivery records older than 120 days
        for (const [k, t] of Object.entries(state.sent)) if (now - t > 120 * 86400) delete state.sent[k];

        state.snap = buildSnapshot(latest.circles, latest.membersByCircle);
        save();
        if (sent) log("info", `sent ${sent} notification(s)`);
      } catch (e) {
        log("error", `chain poll failed: ${e.message}`);
      }
      for (let i = 0; i < pollSeconds && running; i++) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  log("info", `notifier started on ${contract}, poll ${pollSeconds}s, ${Object.keys(state.subs).length} chat(s)`);
  await Promise.all([telegramLoop(), chainLoop()]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
