"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useProton } from "@/components/ProtonProvider";
import { getMyCircles } from "@/lib/rpc";
import { 
  Plus, 
  Coins, 
  Clock, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  AlertCircle, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function MyCirclesPage() {
  const { session, login } = useProton();
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFinished, setShowFinished] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!session) {
      setCircles([]);
      setLoading(false);
      return;
    }

    const fetchCircles = async () => {
      setLoading(true);
      try {
        const myData = await getMyCircles(session.auth.actor);
        if (isMounted) {
          setCircles(myData);
        }
      } catch (err) {
        console.error("Failed to load circles", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCircles();
    return () => { isMounted = false; };
  }, [session]);

  // Frequency helper
  const getFrequencyText = (periodSec: number) => {
    if (periodSec === 86400) return "daily";
    if (periodSec === 604800) return "weekly";
    if (periodSec === 1209600) return "every 2 weeks";
    if (periodSec === 2592000) return "monthly";
    return "each round";
  };

  // If user is not logged in
  if (!session) {
    return (
      <>
        <div className="container-app" style={{ paddingTop: "var(--space-64)", paddingBottom: "var(--space-80)", maxWidth: "560px" }}>
          <div className="card" style={{ textAlign: "center", padding: "var(--space-48) var(--space-32)" }}>
            <div style={{ 
              width: "56px", 
              height: "56px", 
              borderRadius: "50%", 
              background: "var(--brand-subtle)", 
              color: "var(--brand)", 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center",
              marginBottom: "var(--space-20)"
            }}>
              <Users size={28} />
            </div>
            <h1 className="text-h1" style={{ marginBottom: "var(--space-12)" }}>My circles</h1>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-32)" }}>
              Log in with your XPR Network account to view your active savings circles, pending payments and invitations.
            </p>
            <button className="btn-primary btn-large" onClick={login} style={{ width: "100%", marginBottom: "var(--space-16)" }}>
              Log in with WebAuth
            </button>
            <p className="text-caption">
              No account yet? Create one free in the WebAuth app.
            </p>
          </div>
        </div>
        <Footer slim />
      </>
    );
  }

  // Filter circles into categories
  // 1. Needs your action
  const needsActionCircles: { circle: any; reason: string; ctaText: string }[] = [];

  circles.forEach((c) => {
    const parsedAmount = parseFloat(c.amount);
    const requiredDeposit = parsedAmount * c.depositRounds;

    if (c.state === 1) { // Active
      if (c.myMember && c.myMember.paidRound < c.round) {
        needsActionCircles.push({
          circle: c,
          reason: `Your payment of ${parsedAmount.toFixed(2)} USDC is due for round ${c.round}`,
          ctaText: "Pay now"
        });
      }
      if (c.myMember && c.myMember.deposit < requiredDeposit) {
        needsActionCircles.push({
          circle: c,
          reason: `Your security deposit is low (${(c.myMember.deposit / 1000000).toFixed(2)} of ${requiredDeposit.toFixed(2)} USDC)`,
          ctaText: "Top up"
        });
      }
    } else if (c.state === 0) { // Forming
      const isFull = c.membersList.length >= c.maxMembers;
      const isOrderSet = c.membersList.some((m: any) => m.slot !== 0);
      const allApproved = c.membersList.length > 0 && c.membersList.every((m: any) => m.approved === 1);

      if (isFull && !isOrderSet && c.isOrganizer) {
        needsActionCircles.push({
          circle: c,
          reason: "All seats are filled. Set the payout order to proceed.",
          ctaText: "Set order"
        });
      } else if (isOrderSet && !allApproved && c.myMember && c.myMember.approved === 0) {
        needsActionCircles.push({
          circle: c,
          reason: `Payout order needs your approval (you are #${c.myMember.slot}).`,
          ctaText: "Approve order"
        });
      } else if (allApproved && c.isOrganizer) {
        needsActionCircles.push({
          circle: c,
          reason: "All members approved the payout order. Start the circle!",
          ctaText: "Start circle"
        });
      }
    }
  });

  // 2. Active circles
  const activeCircles = circles.filter((c) => c.state === 1);

  // 3. Forming circles
  const formingCircles = circles.filter((c) => c.state === 0);

  // 4. Finished circles (Completed or Cancelled)
  const finishedCircles = circles.filter((c) => c.state === 2 || c.state === 3);

  const hasAnyCircles = circles.length > 0;

  return (
    <>
      <div className="container-app" style={{ paddingTop: "var(--space-40)", paddingBottom: "var(--space-80)" }}>
        {/* Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-32)" }}>
          <div>
            <h1 className="text-h1" style={{ marginBottom: "4px" }}>My circles</h1>
            <p className="text-body" style={{ color: "var(--text-secondary)" }}>
              Circles you organize or participate in.
            </p>
          </div>
          <Link href="/new" className="btn-primary btn-medium" style={{ gap: "6px" }}>
            <Plus size={18} /> New circle
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-16)" }}>
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="card" 
                style={{ 
                  height: "120px", 
                  background: "var(--surface-muted)", 
                  opacity: 0.6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span className="text-caption">Loading your circles...</span>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasAnyCircles && (
          <div className="card" style={{ textAlign: "center", padding: "var(--space-48) var(--space-32)", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ 
              width: "56px", 
              height: "56px", 
              borderRadius: "50%", 
              background: "var(--brand-subtle)", 
              color: "var(--brand)", 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center",
              marginBottom: "var(--space-20)"
            }}>
              <Coins size={28} />
            </div>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-12)" }}>
              You are not in any circle yet
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-32)", maxWidth: "440px", margin: "0 auto var(--space-32)" }}>
              Create a savings circle with family and friends, or join one from an invite link someone sent you.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/new" className="btn-primary btn-medium">
                Create a circle
              </Link>
              <Link href="/how-it-works" className="btn-secondary btn-medium">
                How it works
              </Link>
            </div>
          </div>
        )}

        {/* Content Sections */}
        {!loading && hasAnyCircles && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-40)" }}>

            {/* 1. NEEDS YOUR ACTION */}
            {needsActionCircles.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--space-16)" }}>
                  <h2 className="text-h2" style={{ fontSize: "22px" }}>Needs your action</h2>
                  <span className="status-pill status-warning" style={{ fontSize: "12px", height: "22px" }}>
                    {needsActionCircles.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-16)" }}>
                  {needsActionCircles.map(({ circle, reason, ctaText }) => (
                    <div 
                      key={circle.id} 
                      className="card" 
                      style={{ 
                        background: "var(--warning-bg)", 
                        border: "1px solid #F2B07A",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ 
                          width: "44px", 
                          height: "44px", 
                          borderRadius: "50%", 
                          background: "#FFFFFF", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          color: "var(--warning-text)",
                          flexShrink: 0
                        }}>
                          <Clock size={22} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, fontSize: "17px" }}>{circle.name}</span>
                            <span className="status-pill status-warning" style={{ height: "20px", fontSize: "11px", padding: "0 6px" }}>Action</span>
                          </div>
                          <p className="text-body" style={{ color: "var(--warning-text)", fontWeight: 500 }}>
                            {reason}
                          </p>
                        </div>
                      </div>

                      <Link href={`/c/${circle.id}`} className="btn-primary" style={{ padding: "0 20px", height: "42px" }}>
                        {ctaText}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. ACTIVE CIRCLES */}
            {activeCircles.length > 0 && (
              <div>
                <h2 className="text-h2" style={{ fontSize: "22px", marginBottom: "var(--space-16)" }}>
                  Active
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-20)" }}>
                  {activeCircles.map((circle) => {
                    const parsedAmount = parseFloat(circle.amount).toFixed(2);
                    const pot = (parseFloat(circle.amount) * circle.maxMembers).toFixed(2);
                    const paidMembers = circle.membersList.filter((m: any) => m.paidRound === circle.round).length;
                    const isMyTurn = circle.myMember && circle.myMember.slot === circle.round;

                    return (
                      <Link 
                        key={circle.id} 
                        href={`/c/${circle.id}`} 
                        className="card"
                        style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          justifyContent: "space-between",
                          textDecoration: "none",
                          transition: "border-color 150ms ease, box-shadow 150ms ease",
                          cursor: "pointer"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <h3 className="text-h3" style={{ margin: 0 }}>{circle.name}</h3>
                            <span className="status-pill status-paid">
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)" }} /> Active
                            </span>
                          </div>
                          <p className="text-caption" style={{ marginBottom: "16px" }}>
                            {parsedAmount} USDC {getFrequencyText(circle.periodSec)}, {circle.maxMembers} members
                          </p>

                          <div style={{ 
                            background: isMyTurn ? "var(--pot-subtle)" : "var(--brand-subtle)", 
                            padding: "12px 14px", 
                            borderRadius: "var(--radius-md)", 
                            marginBottom: "16px" 
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <span className="text-label" style={{ color: isMyTurn ? "var(--pot-text)" : "var(--brand)" }}>
                                Round {circle.round} of {circle.maxMembers}
                              </span>
                              <span className="text-caption" style={{ color: isMyTurn ? "var(--pot-text)" : "var(--brand)", fontWeight: 700 }}>
                                Pot: {pot} USDC
                              </span>
                            </div>
                            <p className="text-caption" style={{ color: isMyTurn ? "var(--pot-text)" : "var(--text)", marginTop: "4px", fontWeight: isMyTurn ? 700 : 500 }}>
                              {isMyTurn ? "✨ Your turn this round!" : circle.myMember ? `Your turn: round ${circle.myMember.slot}` : `Organized by ${circle.organizer}`}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span className="text-caption">{paidMembers} of {circle.maxMembers} paid</span>
                            <span className="text-caption" style={{ color: "var(--brand)", fontWeight: 600 }}>View circle →</span>
                          </div>
                          <div style={{ height: "6px", background: "var(--surface-muted)", borderRadius: "var(--radius-full)" }}>
                            <div style={{ 
                              height: "100%", 
                              background: "var(--brand)", 
                              borderRadius: "var(--radius-full)", 
                              width: `${(paidMembers / circle.maxMembers) * 100}%` 
                            }} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. FORMING CIRCLES */}
            {formingCircles.length > 0 && (
              <div>
                <h2 className="text-h2" style={{ fontSize: "22px", marginBottom: "var(--space-16)" }}>
                  Waiting for members
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-20)" }}>
                  {formingCircles.map((circle) => {
                    const rawAmount = parseFloat(circle.amount);
                    const parsedAmount = rawAmount.toFixed(2);
                    const deposit = (rawAmount * circle.depositRounds).toFixed(2);
                    const seatsTaken = circle.membersList.length;
                    const seatsLeft = circle.maxMembers - seatsTaken;

                    return (
                      <Link 
                        key={circle.id} 
                        href={`/c/${circle.id}`} 
                        className="card"
                        style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          justifyContent: "space-between",
                          textDecoration: "none",
                          transition: "border-color 150ms ease",
                          cursor: "pointer"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <h3 className="text-h3" style={{ margin: 0 }}>{circle.name}</h3>
                            <span className="status-pill status-neutral">● Waiting for members</span>
                          </div>
                          <p className="text-caption" style={{ marginBottom: "16px" }}>
                            {parsedAmount} USDC {getFrequencyText(circle.periodSec)}, {circle.isOrganizer ? "Organized by you" : `Organized by ${circle.organizer}`}
                          </p>

                          <div style={{ marginBottom: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span className="text-label">{seatsTaken} of {circle.maxMembers} seats taken</span>
                              <span className="text-caption" style={{ fontWeight: 600, color: "var(--brand)" }}>
                                {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
                              </span>
                            </div>
                            <div style={{ height: "6px", background: "var(--surface-muted)", borderRadius: "var(--radius-full)" }}>
                              <div style={{ 
                                height: "100%", 
                                background: "var(--brand)", 
                                borderRadius: "var(--radius-full)", 
                                width: `${(seatsTaken / circle.maxMembers) * 100}%` 
                              }} />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                          <span className="text-caption" style={{ color: "var(--text-secondary)" }}>
                            Deposit: {deposit} USDC
                          </span>
                          <span className="text-caption" style={{ color: "var(--brand)", fontWeight: 600 }}>
                            Manage & Invite →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. FINISHED CIRCLES */}
            {finishedCircles.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-24)" }}>
                <button
                  type="button"
                  onClick={() => setShowFinished(!showFinished)}
                  className="btn-ghost"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: 0, fontWeight: 600 }}
                >
                  <ChevronDown 
                    size={18} 
                    style={{ 
                      transform: showFinished ? "rotate(180deg)" : "rotate(0deg)", 
                      transition: "transform 150ms ease" 
                    }} 
                  />
                  {showFinished ? "Hide finished" : `Show finished (${finishedCircles.length})`}
                </button>

                {showFinished && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-16)", marginTop: "var(--space-16)" }}>
                    {finishedCircles.map((circle) => (
                      <Link 
                        key={circle.id} 
                        href={`/c/${circle.id}`} 
                        className="card"
                        style={{ 
                          textDecoration: "none", 
                          opacity: 0.85,
                          background: "var(--surface)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: "16px" }}>{circle.name}</span>
                          <span className="status-pill status-neutral">
                            {circle.state === 2 ? "Completed" : "Cancelled"}
                          </span>
                        </div>
                        <p className="text-caption">
                          {circle.maxMembers} rounds completed, {(parseFloat(circle.amount) * circle.maxMembers * circle.maxMembers).toFixed(2)} USDC total volume
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      <Footer slim />
    </>
  );
}
