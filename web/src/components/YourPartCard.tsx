"use client";

import React from "react";
import { useProton } from "./ProtonProvider";
import { getSchedule } from "@/lib/schedule";
import { ClientDeadline } from "./ClientDeadline";
import type { PayoutRow } from "@/lib/rpc";
import { roundStatus } from "@/lib/payouts";
import { tokenOf } from "@/lib/tokens";

interface YourPartCardProps {
  circle: {
    round: number;
    roundStart: number;
    periodSec: number;
    maxMembers: number;
    state: number;
    amount: string;
    depositRounds: number;
  };
  members: any[];
  payouts?: PayoutRow[];
  historyEvents?: any[];
  chainTime?: number;
  initialActor?: string | null;
}

export function YourPartCard({
  circle,
  members,
  payouts,
  historyEvents,
  chainTime,
  initialActor,
}: YourPartCardProps) {
  const { actor } = useProton();
  const currentActor = actor ?? initialActor;

  // Unauthenticated visitor: hide card
  if (!currentActor) return null;

  // Not a member: hide card
  const me = members.find((m) => m.account === currentActor);
  if (!me) return null;

  const token = tokenOf(circle.amount);
  const parsedAmount = parseFloat(circle.amount);
  const fullPot = (parsedAmount * circle.maxMembers).toFixed(2);
  const totalCommitment = (parsedAmount * circle.maxMembers).toFixed(2);

  // Paid so far
  let paidRoundsCount = 0;
  if (payouts && payouts.length > 0) {
    const paidOutCount = payouts.filter((row) => roundStatus(row, me.account) === "paid").length;
    const isCurrentRoundPaid = circle.state === 1 && me.paidRound === circle.round;
    paidRoundsCount = paidOutCount + (isCurrentRoundPaid ? 1 : 0);
  } else {
    paidRoundsCount = Math.min(me.paidRound || 0, circle.maxMembers);
  }
  const paidAmount = (paidRoundsCount * parsedAmount).toFixed(2);

  const depositFull = parsedAmount * circle.depositRounds;
  let currentDeposit = depositFull;
  if (me.deposit) {
    const rawVal = parseFloat(me.deposit);
    if (!isNaN(rawVal)) {
      currentDeposit = rawVal;
    }
  }
  const depositHeld = currentDeposit.toFixed(2);

  const missing = depositFull - currentDeposit;
  const isLast = me.slot === circle.maxMembers;
  const hasReceived = me.received === 1 || me.received === true;

  // Deposit note
  const isDepositFull = currentDeposit >= depositFull - 0.000001;
  const isDepositZero = currentDeposit <= 0.000001;

  let depositNote = "Your deposit comes back when the circle ends.";
  if (isDepositFull) {
    depositNote = "Your deposit comes back when the circle ends.";
  } else if (!hasReceived && !isLast) {
    depositNote = "Your deposit covered a missed round. It is refilled from your pot before the rest is sent to you.";
  } else if (isDepositZero) {
    depositNote = "Your deposit covered a missed round. Nothing will be returned at the end.";
  } else {
    depositNote = `Your deposit covered a missed round. The remaining ${currentDeposit.toFixed(2)} ${token.label} comes back when the circle ends.`;
  }

  // Refill and debt messages before receiving
  const showRefill = missing > 0 && !hasReceived && me.slot < circle.maxMembers;
  const refillText = showRefill ? `${missing.toFixed(2)} ${token.label} of it refills your deposit first.` : null;

  let debtMicro = 0;
  if (typeof me.debt === "number") {
    debtMicro = me.debt;
  } else if (typeof me.debt === "string") {
    if (me.debt.includes(" ")) {
      debtMicro = parseFloat(me.debt) * 1e6;
    } else {
      debtMicro = parseFloat(me.debt) || 0;
    }
  }
  const debtNumeric = debtMicro / 1e6;
  const debtText = debtNumeric > 0 ? `${debtNumeric.toFixed(2)} ${token.label} of unpaid rounds is taken from your pot.` : null;

  // Payout pot text when received
  const myPayoutRow = payouts?.find((p) => p.round === me.slot);
  const myPayoutEvent = historyEvents?.find(
    (e) => e.type === "payout" && (e.round === me.slot || (e.round === undefined && e.to === me.account))
  );

  let receivedPotText = "You received the pot.";
  if (myPayoutRow) {
    receivedPotText = `${parseFloat(myPayoutRow.paid).toFixed(2)} ${token.label} received.`;
  } else if (myPayoutEvent?.amount) {
    receivedPotText = `${parseFloat(myPayoutEvent.amount).toFixed(2)} ${token.label} received.`;
  }

  const schedule = getSchedule(circle, chainTime);
  const payoutRound = me.slot;
  const payoutDeadline = payoutRound > 0 ? schedule.getRoundDeadline(payoutRound) : null;

  return (
    <div className="card">
      <h3 className="text-h3" style={{ marginBottom: "24px" }}>Your part</h3>
      <div style={{ background: "var(--brand-subtle)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "24px" }}>
        <p className="text-caption" style={{ marginBottom: "4px" }}>
          {hasReceived ? "You received the pot" : "You take the pot"}
        </p>
        <p className="text-h3" style={{ marginBottom: "8px", color: "var(--brand)" }}>
          {`Round ${payoutRound > 0 ? payoutRound : "?"}`}
        </p>
        <p className="text-caption">
          {hasReceived ? (
            receivedPotText
          ) : payoutDeadline ? (
            <ClientDeadline
              deadlineSec={payoutDeadline.deadlineSec}
              prefix={`${fullPot} ${token.label}, sent to you as soon as everyone has paid, at the latest `}
              suffix="."
            />
          ) : (
            `${fullPot} ${token.label}, sent to you as soon as everyone has paid, at the latest at the deadline.`
          )}
        </p>
        {!hasReceived && refillText && (
          <p className="text-caption" style={{ marginTop: "4px" }}>
            {refillText}
          </p>
        )}
        {!hasReceived && debtText && (
          <p className="text-caption" style={{ marginTop: "4px" }}>
            {debtText}
          </p>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
        <span className="text-body" style={{ color: "var(--text-secondary)" }}>Paid so far</span>
        <span className="text-body" style={{ fontWeight: 700 }}>{paidAmount} of {totalCommitment}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
        <span className="text-body" style={{ color: "var(--text-secondary)" }}>Security deposit</span>
        <span className="text-body" style={{ fontWeight: 700 }}>{depositHeld} held</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "16px", marginBottom: "8px" }}>
        <span className="text-body" style={{ color: "var(--text-secondary)" }}>Missed payments</span>
        <span className="text-body" style={{ fontWeight: 700 }}>{me.missed ? me.missed : "None"}</span>
      </div>
      <p className="text-caption">{depositNote}</p>
    </div>
  );
}

export default YourPartCard;
