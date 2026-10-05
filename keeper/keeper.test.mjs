import { test } from "node:test";
import assert from "node:assert/strict";
import { decide } from "./keeper.mjs";

const circle = { state: 1, round: 2, roundStart: 1000, periodSec: 86400 };
const paid = (account) => ({ account, paidRound: 2 });
const unpaid = (account) => ({ account, paidRound: 1 });

test("skips circles that are not active", () => {
  assert.equal(decide({ ...circle, state: 2 }, [], 0).action, "skip");
});

test("pays out as soon as everyone has paid", () => {
  assert.equal(decide(circle, [paid("alice"), paid("bob")], 1500).action, "payout");
});

test("waits before the deadline when someone has not paid", () => {
  const d = decide(circle, [paid("alice"), unpaid("bob")], 1000 + 86399);
  assert.equal(d.action, "wait");
  assert.match(d.reason, /bob/);
});

test("pays out at the deadline even if someone has not paid", () => {
  const d = decide(circle, [paid("alice"), unpaid("bob")], 1000 + 86400);
  assert.equal(d.action, "payout");
  assert.match(d.reason, /deadline passed, unpaid: bob/);
});
