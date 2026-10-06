import { test } from "node:test";
import assert from "node:assert/strict";
import { computeEvents, buildSnapshot, formatDuration } from "./events.mjs";

const circle = (o = {}) => ({
  id: 1, organizer: "alice", name: "Family", amount: "10.000000 XUSDC",
  maxMembers: 3, members: 3, periodSec: 86400, state: 1, round: 1, roundStart: 1000, ...o,
});
const member = (account, o = {}) => ({
  account, slot: 1, deposit: "10.000000 XUSDC", paidRound: 0, received: false,
  defaulted: false, approved: true, ...o,
});
const keys = (evs) => evs.filter((e) => e.text).map((e) => e.key.split(":")[0] + ":" + e.account);

test("24h reminder only for unpaid members", () => {
  const c = circle();
  const ms = { 1: [member("alice", { paidRound: 1 }), member("bob")] };
  const evs = computeEvents({ circles: [c], membersByCircle: ms, now: 1000 + 3600 });
  assert.deepEqual(keys(evs), ["due24:bob"]);
});

test("2h reminder replaces 24h when noticed late", () => {
  const evs = computeEvents({ circles: [circle()], membersByCircle: { 1: [member("bob")] }, now: 1000 + 86400 - 3600 });
  assert.deepEqual(keys(evs), ["due2:bob"]);
  assert.ok(evs.some((e) => e.key.startsWith("due24:") && e.text === null));
});

test("no reminder after the deadline", () => {
  const evs = computeEvents({ circles: [circle()], membersByCircle: { 1: [member("bob")] }, now: 1000 + 86400 });
  assert.deepEqual(keys(evs), []);
});

test("organizer is told when the circle is full", () => {
  const c = circle({ state: 0, round: 0 });
  const ms = { 1: ["alice", "bob", "carol"].map((a) => member(a, { slot: 0, approved: false })) };
  assert.deepEqual(keys(computeEvents({ circles: [c], membersByCircle: ms, now: 0 })), ["full:alice"]);
});

test("members are asked to approve, approved members are not", () => {
  const c = circle({ state: 0, round: 0 });
  const ms = { 1: [member("alice", { slot: 1, approved: true }), member("bob", { slot: 2, approved: false })] };
  assert.deepEqual(keys(computeEvents({ circles: [c], membersByCircle: ms, now: 0 })), ["approve:bob"]);
});

test("first sight of a circle produces no change events", () => {
  const ms = { 1: [member("bob", { received: true, paidRound: 1 })] };
  assert.deepEqual(keys(computeEvents({ prev: {}, circles: [circle()], membersByCircle: ms, now: 0 })), []);
});

test("received, deposit used and default are detected from changes", () => {
  const before = { 1: [member("alice", { paidRound: 1 }), member("bob", { paidRound: 1, slot: 2 })] };
  const prev = buildSnapshot([circle()], before);
  const after = { 1: [
    member("alice", { paidRound: 1, received: true }),
    member("bob", { paidRound: 1, slot: 2, deposit: "0.000000 XUSDC" }),
  ] };
  const evs = computeEvents({ prev, circles: [circle({ round: 2, roundStart: 1000 + 86400 })], membersByCircle: after, now: 0 });
  assert.deepEqual(keys(evs).filter((k) => !k.startsWith("due")).sort(), ["deposit:bob", "received:alice"]);
});

test("default is reported once, not as deposit use", () => {
  const prev = buildSnapshot([circle()], { 1: [member("carol", { deposit: "0.000000 XUSDC" })] });
  const evs = computeEvents({ prev, circles: [circle({ round: 2 })], membersByCircle: { 1: [member("carol", { deposit: "0.000000 XUSDC", defaulted: true })] }, now: 0 });
  assert.deepEqual(keys(evs).filter((k) => !k.startsWith("due")), ["default:carol"]);
});

test("start and completion are announced", () => {
  const prevForming = buildSnapshot([circle({ state: 0 })], { 1: [member("bob")] });
  assert.deepEqual(keys(computeEvents({ prev: prevForming, circles: [circle()], membersByCircle: { 1: [member("bob")] }, now: 999999 })), ["started:bob"]);
  const prevActive = buildSnapshot([circle()], { 1: [member("bob")] });
  assert.deepEqual(keys(computeEvents({ prev: prevActive, circles: [circle({ state: 2 })], membersByCircle: { 1: [member("bob")] }, now: 0 })), ["completed:bob"]);
});

test("durations are readable", () => {
  assert.equal(formatDuration(90061), "1d 1h");
  assert.equal(formatDuration(3900), "1h 5m");
  assert.equal(formatDuration(300), "5m");
});
