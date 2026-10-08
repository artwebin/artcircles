// Pure logic: turns chain state (and the previous snapshot) into notifications.
// No I/O here, so every rule is covered by unit tests.

export const STATE_FORMING = 0;
export const STATE_ACTIVE = 1;
export const STATE_COMPLETED = 2;

const HOUR = 3600;

export function assetAmount(asset) {
  return Number(String(asset).split(" ")[0]);
}

export function formatAsset(asset) {
  const [num, sym] = String(asset).split(" ");
  return `${Number(num).toFixed(2)} ${sym}`;
}

export function formatDuration(sec) {
  if (sec <= 0) return "now";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / HOUR);
  const m = Math.floor((sec % HOUR) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatUtc(sec) {
  return new Date(sec * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

// Deadlines are rendered per chat, in that chat's time zone, when the message is sent
export function deadlineToken(sec) {
  return `{{time:${sec}}}`;
}

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function formatLocal(sec, tz) {
  if (!tz) return formatUtc(sec);
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(sec * 1000));
  return `${s} (${tz})`;
}

export function renderTimes(text, tz) {
  return text.replace(/\{\{time:(\d+)\}\}/g, (_, sec) => formatLocal(Number(sec), tz));
}

export function buildSnapshot(circles, membersByCircle) {
  const snap = {};
  for (const c of circles) {
    const members = {};
    for (const m of membersByCircle[c.id] || []) {
      members[m.account] = {
        paidRound: m.paidRound,
        deposit: assetAmount(m.deposit),
        received: !!m.received,
        defaulted: !!m.defaulted,
        slot: m.slot,
        approved: !!m.approved,
      };
    }
    snap[c.id] = { state: c.state, round: c.round, members };
  }
  return snap;
}

function label(c) {
  return `circle "${c.name}" (#${c.id})`;
}

export function computeEvents({ prev, circles, membersByCircle, now }) {
  const events = [];
  const push = (account, key, text) => events.push({ account, key, text });

  for (const c of circles) {
    const members = membersByCircle[c.id] || [];
    const before = prev ? prev[c.id] : undefined;
    const deadline = c.roundStart + c.periodSec;
    const left = deadline - now;
    const amount = formatAsset(c.amount);

    // Organizer: circle is full and needs an order
    if (c.state === STATE_FORMING && c.members === c.maxMembers && members.every((m) => m.slot === 0)) {
      push(c.organizer, `full:${c.id}`,
        `${label(c)} is full. Set the payout order so members can approve it.`);
    }

    for (const m of members) {
      const mb = before ? before.members[m.account] : undefined;

      // Order proposed: ask for approval (a new order produces a new key)
      if (c.state === STATE_FORMING && m.slot !== 0 && !m.approved) {
        const orderKey = members.map((x) => `${x.account}=${x.slot}`).sort().join(",");
        push(m.account, `approve:${c.id}:${orderKey}`,
          `The payout order for ${label(c)} is set. You are number ${m.slot} of ${c.maxMembers}. Please review and approve it if you agree.`);
      }

      if (c.state === STATE_ACTIVE && m.paidRound !== c.round && left > 0) {
        const pot = formatAsset(`${assetAmount(c.amount) * c.members} ${c.amount.split(" ")[1]}`);
        const intro = m.slot === c.round
          ? `This round the pot of ${label(c)} goes to you. Pay your share of ${amount} within ${formatDuration(left)} to receive the full ${pot}.\n`
          : `Payment due in ${formatDuration(left)} for ${label(c)}, round ${c.round} of ${c.members}: ${amount}.\n`;
        const text = intro +
          `Send ${amount} to artcircles with memo pay:${c.id}\nDeadline: ${deadlineToken(deadline)}`;
        if (left <= 2 * HOUR) {
          push(m.account, `due2:${c.id}:${c.round}:${m.account}`, text);
          // Skip the 24h reminder if we only noticed the round this late
          events.push({ account: m.account, key: `due24:${c.id}:${c.round}:${m.account}`, text: null });
        } else if (left <= 24 * HOUR) {
          push(m.account, `due24:${c.id}:${c.round}:${m.account}`, text);
        }
      }

      if (!before || !mb) continue;

      if (before.state === STATE_FORMING && c.state === STATE_ACTIVE) {
        push(m.account, `started:${c.id}:${m.account}`,
          `${label(c)} has started. You are number ${m.slot} of ${c.members}. Round 1 deadline: ${deadlineToken(deadline)}.`);
      }
      if (!mb.received && m.received) {
        push(m.account, `received:${c.id}:${m.account}`,
          `You received the pot of ${label(c)}, round ${m.slot}.`);
      }
      if (assetAmount(m.deposit) < mb.deposit && !m.defaulted) {
        push(m.account, `deposit:${c.id}:${before.round}:${m.account}`,
          `Your payment for ${label(c)}, round ${before.round}, was missed and covered from your deposit. ` +
          `Refill it by sending the missing amount with memo topup:${c.id} to stay protected.`);
      }
      if (!mb.defaulted && m.defaulted) {
        push(m.account, `default:${c.id}:${m.account}`,
          `You missed a payment in ${label(c)} with no deposit left. It was recorded as a default and counted as debt.`);
      }
      if (before.state === STATE_ACTIVE && c.state === STATE_COMPLETED) {
        push(m.account, `completed:${c.id}:${m.account}`,
          `${label(c)} is completed. Your remaining deposit has been refunded.`);
      }
    }
  }
  return events;
}
