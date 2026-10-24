"use client";

import React from "react";
import { useProton } from "./ProtonProvider";
import { getSchedule } from "@/lib/schedule";
import { ClientDeadline } from "./ClientDeadline";

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
  chainTime?: number;
  initialActor?: string | null;
}

export function YourPartCard({
  circle,
  members,
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

  const parsedAmount = parseFloat(circle.amount);
  const fullPot = (parsedAmount * circle.maxMembers).toFixed(2);
  const totalCommitment = (parsedAmount * circle.maxMembers).toFixed(2);
  const paidRoundsCount = Math.min(me.paidRound || 0, circle.maxMembers);
  const paidAmount = (paidRoundsCount * parsedAmount).toFixed(2);

  let depositHeld = (parsedAmount * circle.depositRounds).toFixed(2);
  if (me.deposit) {
    const rawVal = parseFloat(me.deposit);
    if (!isNaN(rawVal)) {
      depositHeld = rawVal.toFixed(2);
    }
  }

  const schedule = getSchedule(circle, chainTime);
  const payoutRound = me.slot;
  const payoutDeadline = payoutRound > 0 ? schedule.getRoundDeadline(payoutRound) : null;

  return (
    <div className="card">
      <h3 className="text-h3" style={{ marginBottom: "24px" }}>Your part</h3>
      <div style={{ background: "var(--brand-subtle)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "24px" }}>
        <p className="text-caption" style={{ marginBottom: "4px" }}>You take the pot</p>
        <p className="text-h3" style={{ marginBottom: "8px", color: "var(--brand)" }}>
          {payoutDeadline ? (
            <ClientDeadline
              deadlineSec={payoutDeadline.deadlineSec}
              prefix={`Round ${payoutRound}, `}
            />
          ) : (
            `Round ${payoutRound > 0 ? payoutRound : "?"}`
          )}
        </p>
        <p className="text-caption">{fullPot} USDC, sent to you automatically</p>
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
      <p className="text-caption">Your deposit comes back when the circle ends.</p>
    </div>
  );
}

export default YourPartCard;
