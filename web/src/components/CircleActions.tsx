"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProton } from "./ProtonProvider";
import { formatContractError } from "@/lib/errors";
import { getMembers, getCircle } from "@/lib/rpc";
import { ConfirmationSheet } from "./ConfirmationSheet";

interface CircleActionsProps {
  circleId: string;
  circleState: number;
  amount: string;
  depositRounds: number;
  members: any[];
  maxMembers: number;
  currentRound: number;
  organizer: string;
}

export function CircleActions({
  circleId,
  circleState,
  amount,
  depositRounds,
  members,
  maxMembers,
  currentRound,
  organizer,
}: CircleActionsProps) {
  const router = useRouter();
  const { session, login } = useProton();
  const [error, setError] = useState<{ message: string; rawDetails?: string } | null>(null);

  // State for confirmation sheet
  const [sheetConfig, setSheetConfig] = useState<{
    isOpen: boolean;
    title: string;
    sentence: string;
    to?: string;
    amountStr?: string;
    rawAmount?: number;
    memo?: string;
    actions: any[];
    successSentence: string;
    pollCondition?: () => Promise<boolean>;
  } | null>(null);

  // State for setting order
  const [isSettingOrder, setIsSettingOrder] = useState(false);
  const [customOrder, setCustomOrder] = useState<string[]>([]);

  useEffect(() => {
    if (members.length > 0 && customOrder.length === 0) {
      setCustomOrder(members.map(m => m.account));
    }
  }, [members, customOrder.length]);

  if (!session) {
    return (
      <div style={{ marginTop: "24px" }}>
        <button className="btn-primary" onClick={login}>
          Login to participate
        </button>
      </div>
    );
  }

  const account = session.auth.actor;
  const me = members.find((m) => m.account === account);
  const parsedAmount = parseFloat(amount);
  const isOrganizer = account === organizer;

  const isOrderSet = members.some(m => m.slot !== 0);
  const allApproved = members.length > 0 && members.every(m => !!m.approved);

  // --- Handlers using Confirmation Sheet ---
  const handleJoin = () => {
    const rawDeposit = parsedAmount * depositRounds;
    const totalDeposit = rawDeposit.toFixed(6) + " XUSDC";
    setSheetConfig({
      isOpen: true,
      title: "Join circle",
      sentence: `You are sending ${totalDeposit} to artcircles to join circle #${circleId} with a ${depositRounds}-round security deposit.`,
      to: "artcircles",
      amountStr: totalDeposit,
      rawAmount: rawDeposit,
      memo: `join:${circleId}`,
      actions: [
        {
          account: "xtokens",
          name: "transfer",
          authorization: [session.auth],
          data: {
            from: account,
            to: "artcircles",
            quantity: totalDeposit,
            memo: `join:${circleId}`,
          },
        },
      ],
      successSentence: "You joined the circle",
      pollCondition: async () => {
        const updated = await getMembers(circleId);
        return updated.some((m: any) => m.account === account);
      },
    });
  };

  const handlePay = () => {
    const payAmount = parsedAmount.toFixed(6) + " XUSDC";
    setSheetConfig({
      isOpen: true,
      title: `Pay round ${currentRound}`,
      sentence: `You are sending ${payAmount} to artcircles to pay round ${currentRound} of ${maxMembers} in circle #${circleId}.`,
      to: "artcircles",
      amountStr: payAmount,
      rawAmount: parsedAmount,
      memo: `pay:${circleId}`,
      actions: [
        {
          account: "xtokens",
          name: "transfer",
          authorization: [session.auth],
          data: {
            from: account,
            to: "artcircles",
            quantity: payAmount,
            memo: `pay:${circleId}`,
          },
        },
      ],
      successSentence: `Round ${currentRound} payment confirmed`,
      pollCondition: async () => {
        const updated = await getMembers(circleId);
        const myMem = updated.find((m: any) => m.account === account);
        return myMem ? myMem.paidRound >= currentRound : false;
      },
    });
  };

  const handleLeave = () => {
    const rawDeposit = parsedAmount * depositRounds;
    const totalDeposit = rawDeposit.toFixed(6) + " XUSDC";
    setSheetConfig({
      isOpen: true,
      title: "Leave circle",
      sentence: `You are leaving circle #${circleId}. Your security deposit of ${totalDeposit} will be refunded immediately.`,
      to: "artcircles",
      actions: [
        {
          account: "artcircles",
          name: "leave",
          authorization: [session.auth],
          data: { account: account, id: circleId },
        },
      ],
      successSentence: "You left the circle",
      pollCondition: async () => {
        const updated = await getMembers(circleId);
        return !updated.some((m: any) => m.account === account);
      },
    });
  };

  const handleApprove = () => {
    setSheetConfig({
      isOpen: true,
      title: "Approve payout order",
      sentence: `You are approving the payout order for circle #${circleId}. You take the pot in round ${me?.slot || "?"}.`,
      to: "artcircles",
      actions: [
        {
          account: "artcircles",
          name: "approve",
          authorization: [session.auth],
          data: { account: account, id: circleId },
        },
      ],
      successSentence: "Payout order approved",
      pollCondition: async () => {
        const updated = await getMembers(circleId);
        const myMem = updated.find((m: any) => m.account === account);
        return myMem ? !!myMem.approved : false;
      },
    });
  };

  const handleStart = () => {
    setSheetConfig({
      isOpen: true,
      title: "Start circle",
      sentence: `You are starting circle #${circleId}. All members have approved the payout order. Round 1 will begin immediately.`,
      to: "artcircles",
      actions: [
        {
          account: "artcircles",
          name: "start",
          authorization: [session.auth],
          data: { organizer: account, id: circleId },
        },
      ],
      successSentence: "Circle started",
      pollCondition: async () => {
        const c = await getCircle(circleId);
        return c ? c.state === 1 : false;
      },
    });
  };

  const handleCancel = () => {
    setSheetConfig({
      isOpen: true,
      title: "Cancel circle",
      sentence: `You are cancelling circle #${circleId}. All member deposits will be refunded immediately.`,
      to: "artcircles",
      actions: [
        {
          account: "artcircles",
          name: "cancel",
          authorization: [session.auth],
          data: { organizer: account, id: circleId },
        },
      ],
      successSentence: "Circle cancelled and deposits refunded",
      pollCondition: async () => {
        const c = await getCircle(circleId);
        return c ? c.state === 3 : false;
      },
    });
  };

  const submitOrder = () => {
    setSheetConfig({
      isOpen: true,
      title: "Save payout order",
      sentence: `You are proposing the payout order for circle #${circleId}. Members will be asked to review and approve their position.`,
      to: "artcircles",
      actions: [
        {
          account: "artcircles",
          name: "setorder",
          authorization: [session.auth],
          data: {
            organizer: account,
            id: circleId,
            order: customOrder,
          },
        },
      ],
      successSentence: "Payout order saved",
      pollCondition: async () => {
        const mems = await getMembers(circleId);
        return mems.some((m: any) => m.slot !== 0);
      },
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...customOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setCustomOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === customOrder.length - 1) return;
    const newOrder = [...customOrder];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setCustomOrder(newOrder);
  };

  // --- Setting Order UI ---
  if (isSettingOrder) {
    return (
      <div className="card" style={{ marginTop: "24px", background: "var(--bg-app)" }}>
        <h3 style={{ marginBottom: "16px" }}>Set Payout Order</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {customOrder.map((acc, idx) => (
            <div key={acc} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)", padding: "12px", borderRadius: "8px" }}>
              <span><strong style={{ marginRight: "12px" }}>{idx + 1}.</strong> {acc}</span>
              <div>
                <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ padding: "4px 8px", fontSize: "18px", opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => moveDown(idx)} disabled={idx === customOrder.length - 1} style={{ padding: "4px 8px", fontSize: "18px", opacity: idx === customOrder.length - 1 ? 0.3 : 1 }}>↓</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-primary" onClick={submitOrder}>Save Order</button>
          <button className="btn-secondary" onClick={() => setIsSettingOrder(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  let actionButton = null;

  if (circleState === 0) { // Forming
    if (members.length < maxMembers) {
      if (!me) {
        actionButton = (
          <button className="btn-primary" onClick={handleJoin}>
            Join with a {(parsedAmount * depositRounds).toFixed(2)} USDC deposit
          </button>
        );
      } else {
        actionButton = (
          <button className="btn-secondary" onClick={handleLeave}>
            Leave circle (seats still available)
          </button>
        );
      }
    } else {
      // Circle is FULL
      if (!isOrderSet) {
        if (isOrganizer) {
          actionButton = (
            <Link href={`/c/${circleId}/order`} className="btn-primary" style={{ padding: "0 24px", height: "48px" }}>
              Set payout order
            </Link>
          );
        } else {
          actionButton = (
            <div style={{ padding: "12px", background: "var(--bg-app)", borderRadius: "8px", textAlign: "center" }}>
              Waiting for the organizer to set the payout order...
            </div>
          );
        }
      } else {
        // Order is set, waiting for approvals
        if (!allApproved) {
          if (me && !me.approved) {
            actionButton = (
              <button className="btn-primary" onClick={handleApprove}>
                Approve payout order (You are #{me.slot})
              </button>
            );
          } else {
            actionButton = (
              <div style={{ padding: "12px", background: "var(--bg-app)", borderRadius: "8px", textAlign: "center", marginBottom: isOrganizer ? "8px" : "0" }}>
                Waiting for all members to approve...
              </div>
            );
          }
        } else {
          // All approved
          if (isOrganizer) {
            actionButton = (
              <button className="btn-primary" onClick={handleStart}>
                Start Circle
              </button>
            );
          } else {
            actionButton = (
              <div style={{ padding: "12px", background: "var(--bg-app)", borderRadius: "8px", textAlign: "center" }}>
                Waiting for the organizer to start the circle...
              </div>
            );
          }
        }
      }

      // Organizer can always cancel if it hasn't started
      if (isOrganizer) {
        actionButton = (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {actionButton}
            <button className="btn-secondary" onClick={handleCancel} style={{ color: "var(--tag-text-alert)", borderColor: "var(--tag-bg-alert)" }}>
              Cancel circle & refund deposits
            </button>
          </div>
        );
      } else if (!isOrganizer && me && !isOrderSet) {
          // Member can leave if order isn't set yet (optional, but good UX)
          actionButton = (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {actionButton}
              <button className="btn-secondary" onClick={handleLeave}>
                Leave circle
              </button>
            </div>
          );
      }
    }
  } else if (circleState === 1) { // Active
    if (me) {
      if (me.paidRound < currentRound) {
        actionButton = (
          <button className="btn-primary" onClick={handlePay}>
            Pay {parsedAmount.toFixed(2)} USDC
          </button>
        );
      }
    }
  }

  return (
    <>
      {error && (
        <div style={{ padding: "16px 20px", background: "var(--warning-bg)", color: "var(--warning-text)", borderRadius: "var(--radius-md)", border: "1px solid #F2B07A", marginBottom: "24px" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "15px" }}>{error.message}</p>
          {error.rawDetails && (
            <details style={{ marginTop: "8px", fontSize: "12px", opacity: 0.85, cursor: "pointer" }}>
              <summary style={{ fontWeight: 500 }}>Technical details</summary>
              <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all" }}>
                {error.rawDetails}
              </pre>
            </details>
          )}
        </div>
      )}
      {actionButton && (
        <div className="card" style={{ 
          background: circleState === 1 && me && me.paidRound < currentRound ? "var(--warning-bg)" : "var(--surface)", 
          borderColor: circleState === 1 && me && me.paidRound < currentRound ? "#F2B07A" : "var(--border)",
          display: "flex", gap: "24px", alignItems: "center", marginBottom: "var(--space-24)" 
        }}>
          {circleState === 1 && me && me.paidRound < currentRound && (
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--warning-text)", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          )}
          <div style={{ flex: 1 }}>
            {circleState === 1 && me && me.paidRound < currentRound ? (
              <>
                <h3 className="text-h3" style={{ color: "var(--warning-text)", marginBottom: "8px" }}>
                  Your payment of {parsedAmount.toFixed(2)} USDC is due in 2 days
                </h3>
                <p className="text-body" style={{ color: "var(--warning-text)" }}>
                  Round {currentRound} closes Fri 17 Oct at 18:00 CEST. If you miss it, your security deposit covers this round.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-h3" style={{ marginBottom: "8px" }}>Next Action</h3>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                  Waiting for your input or others to proceed.
                </p>
              </>
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            {actionButton}
          </div>
        </div>
      )}
      <div style={{ textAlign: "right", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "var(--space-24)" }}>
        Logged in as <strong>{account}</strong> {isOrganizer && "(Organizer)"}
      </div>

      {sheetConfig && (
        <ConfirmationSheet
          {...sheetConfig}
          circleId={circleId}
          account={account}
          onClose={() => setSheetConfig(null)}
          onSuccess={() => {
            setSheetConfig(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
