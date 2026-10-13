"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useProton } from "@/components/ProtonProvider";
import { ReputationCard } from "@/components/ReputationCard";
import { 
  ReputationData, 
  getAvatarColor 
} from "@/lib/reputation";
import { 
  ShieldCheck, 
  ChevronRight, 
  Copy, 
  Check, 
  Share2, 
  Bell, 
  LogOut 
} from "lucide-react";

function getFrequencyText(periodSec: number) {
  if (periodSec === 86400) return "every day";
  if (periodSec === 604800) return "every week";
  if (periodSec === 1209600) return "every 2 weeks";
  if (periodSec === 2592000) return "every month";
  return "every round";
}

function formatMonthYear(secOrIso: number | string | null | undefined): string {
  if (!secOrIso) return "Unknown";
  let date: Date;
  if (typeof secOrIso === "number") {
    date = new Date(secOrIso * 1000);
  } else {
    date = new Date(secOrIso.endsWith("Z") ? secOrIso : secOrIso + "Z");
  }
  if (isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

interface ProfileViewProps {
  account: string;
  reputation: ReputationData;
  userInfo: any;
  accountCreated: string | null;
  circles: any[];
}

export function ProfileView({
  account,
  reputation,
  userInfo,
  accountCreated,
  circles,
}: ProfileViewProps) {
  const { session, logout } = useProton();
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanShare(true);
    }
  }, []);

  // Strict rule: Decide owner or visitor only after session is restored on client.
  // Server render and initial client hydration are always visitor version.
  const isOwner = isMounted && !!session && session.auth?.actor === account;

  const isKycVerified = userInfo?.verified === 1 || (userInfo?.kyc && userInfo.kyc.length > 0);
  const avatarColor = getAvatarColor(account);

  // Calculate earliest circle date and organized count
  let earliestSec: number | null = null;
  let organizedCount = 0;

  circles.forEach((c) => {
    if (c.organizer === account) {
      organizedCount++;
      if (c.created && (earliestSec === null || c.created < earliestSec)) {
        earliestSec = c.created;
      }
    }
    const myMem = c.membersList?.find((m: any) => m.account === account);
    if (myMem && myMem.joined && (earliestSec === null || myMem.joined < earliestSec)) {
      earliestSec = myMem.joined;
    }
  });

  const totalCirclesCount = circles.length;
  let identityLine = "";

  if (totalCirclesCount === 0) {
    identityLine = "Not in any circle yet.";
  } else {
    const sinceMonthYear = earliestSec ? formatMonthYear(earliestSec) : "recently";
    if (organizedCount === 0) {
      identityLine = `In XPR Circles since ${sinceMonthYear}.`;
    } else if (organizedCount === totalCirclesCount) {
      identityLine = `In XPR Circles since ${sinceMonthYear}. Organizer of ${organizedCount} ${organizedCount === 1 ? "circle" : "circles"}.`;
    } else {
      identityLine = `In XPR Circles since ${sinceMonthYear}. Organized ${organizedCount} of ${totalCirclesCount} ${totalCirclesCount === 1 ? "circle" : "circles"}.`;
    }
  }

  // Filter current vs past circles
  // Current: state 0 (forming) or state 1 (active)
  // Past: state 2 (completed) or state 3 (cancelled)
  const currentCircles = circles
    .filter((c) => c.state === 0 || c.state === 1)
    .sort((a, b) => {
      // Sort: active (1) first, then waiting for order, then waiting for members; inside each, newest first
      const getPriority = (c: any) => {
        if (c.state === 1) return 3;
        const isOrderSet = c.membersList?.some((m: any) => m.slot !== 0);
        if (isOrderSet) return 2;
        return 1;
      };
      const pDiff = getPriority(b) - getPriority(a);
      if (pDiff !== 0) return pDiff;
      return Number(b.id) - Number(a.id);
    });

  const pastCircles = circles
    .filter((c) => c.state === 2 || c.state === 3)
    .sort((a, b) => Number(b.id) - Number(a.id));

  const visiblePastCircles = showAllPast ? pastCircles : pastCircles.slice(0, 10);

  // Sharing handling
  const profileUrl = `circles.artwebin.com/a/${account}`;
  const fullProfileUrl = `https://circles.artwebin.com/a/${account}`;

  const handleShareOrCopy = async () => {
    if (canShare && navigator.share) {
      try {
        await navigator.share({
          title: `${account} on XPR Circles`,
          url: fullProfileUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(fullProfileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const input = document.getElementById("profile-share-link") as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }
  };

  return (
    <>
      <div className="profile-page-container">
        {/* Full-width Identity Block above the columns */}
        <div className="identity-block">
          <div
            className="avatar-circle"
            style={{
              background: avatarColor.bg,
              color: avatarColor.text,
            }}
          >
            {account[0].toLowerCase()}
          </div>

          <div style={{ flex: 1 }}>
            <div className="name-kyc-row">
              <h1 className="account-h1">{account}</h1>
              {isKycVerified ? (
                <span className="kyc-pill kyc-verified">
                  <ShieldCheck size={16} aria-hidden={true} /> KYC verified
                </span>
              ) : (
                <span className="kyc-pill kyc-unverified">
                  <span className="unverified-dot" aria-hidden={true} /> No KYC
                </span>
              )}
            </div>

            <p className="identity-subline">{identityLine}</p>
          </div>
        </div>

        {/* Two Columns Grid */}
        <div className="profile-grid">
          {/* MAIN COLUMN (640px on desktop) */}
          <div className="main-col">
            {/* 1. Reputation Card */}
            <ReputationCard reputation={reputation} />

            {/* 2. Current Circles Card */}
            <div className="card profile-card">
              <div className="card-header-row">
                <h2 className="card-title-h2">Current circles</h2>
                <span className="card-count-label">
                  {currentCircles.length === 0 ? "None yet" : `${currentCircles.length} ${currentCircles.length === 1 ? "circle" : "circles"}`}
                </span>
              </div>

              {currentCircles.length === 0 ? (
                <div className="empty-state-container">
                  {isOwner ? (
                    <>
                      <p className="empty-text">You are not in any circle right now.</p>
                      <Link href="/new" className="btn-secondary btn-small" style={{ display: "inline-flex" }}>
                        Create a circle
                      </Link>
                    </>
                  ) : (
                    <p className="empty-text">Not in any circle right now.</p>
                  )}
                </div>
              ) : (
                <div className="circle-rows-list">
                  {currentCircles.map((c) => {
                    const parsedAmount = parseFloat(c.amount).toFixed(2);
                    const myMember = c.membersList?.find((m: any) => m.account === account);
                    const isOrganizer = c.organizer === account;
                    const seatsTaken = c.membersList?.length || 0;
                    const isOrderSet = c.membersList?.some((m: any) => m.slot !== 0);
                    const approvedCount = c.membersList?.filter((m: any) => m.approved === 1).length || 0;

                    // Line 3 calculation
                    let line3 = "";
                    let rightPill: React.ReactNode = null;

                    if (c.state === 0) {
                      if (!isOrderSet) {
                        line3 = `${seatsTaken} of ${c.maxMembers} seats taken. Starts when everyone has joined.`;
                      } else {
                        line3 = `Order approved by ${approvedCount} of ${c.membersList.length}.`;
                      }
                    } else if (c.state === 1) {
                      if (!myMember) {
                        line3 = "Organizing only, not a member.";
                      } else {
                        // Payment state pill for active circle
                        const isPaid = myMember.paidRound >= c.round;
                        rightPill = isPaid ? (
                          <span className="pill-paid">Paid this round</span>
                        ) : (
                          <span className="pill-unpaid">Not paid yet</span>
                        );

                        if (myMember.slot > c.round) {
                          const turnSec = (c.roundStart || Math.floor(Date.now() / 1000)) + (myMember.slot - c.round) * c.periodSec;
                          const turnDateStr = new Date(turnSec * 1000).toLocaleDateString("en-US", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          });
                          line3 = `Round ${c.round} of ${c.maxMembers}. ${account} takes the pot in round ${myMember.slot}, ${turnDateStr}.`;
                        } else if (myMember.slot === c.round) {
                          line3 = `Round ${c.round} of ${c.maxMembers}. ${account} takes the pot this round.`;
                        } else {
                          line3 = `Round ${c.round} of ${c.maxMembers}. ${account} took the pot in round ${myMember.slot}.`;
                        }
                      }
                    }

                    return (
                      <Link key={c.id} href={`/c/${c.id}`} className="circle-row-item">
                        <div className="row-content-left">
                          {/* Line 1 */}
                          <div className="row-line1">
                            <span className="row-circle-name">{c.name}</span>
                            {c.state === 1 ? (
                              <span className="status-pill status-paid" style={{ height: "22px", fontSize: "12px", gap: "5px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)" }} /> Active
                              </span>
                            ) : (
                              <span className="status-pill status-neutral" style={{ height: "22px", fontSize: "12px" }}>
                                ● Waiting for members
                              </span>
                            )}
                            {c.state === 1 && myMember && myMember.missed > 0 && (
                              <span className="pill-missed-red">
                                Missed {myMember.missed}
                              </span>
                            )}
                            {isOrganizer && (
                              <span className="pill-organizer-white">Organizer</span>
                            )}
                          </div>

                          {/* Line 2 */}
                          <div className="row-line2">
                            {c.maxMembers} members, {parsedAmount} USDC {getFrequencyText(c.periodSec)}.
                          </div>

                          {/* Line 3 */}
                          <div className="row-line3">{line3}</div>
                        </div>

                        {/* Right Pill & Chevron */}
                        <div className="row-right">
                          {rightPill}
                          <ChevronRight size={18} className="row-chevron" aria-hidden={true} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Past Circles Card */}
            <div className="card profile-card">
              <div className="card-header-row">
                <h2 className="card-title-h2">Past circles</h2>
                <span className="card-count-label">
                  {pastCircles.length === 0 ? "None yet" : `${pastCircles.length} completed`}
                </span>
              </div>

              {pastCircles.length === 0 ? (
                <div className="empty-state-container">
                  {isOwner ? (
                    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
                      <p style={{ fontWeight: 600, fontSize: "16px", marginBottom: "6px", color: "var(--text)" }}>
                        No finished circles yet
                      </p>
                      <p className="empty-text">
                        When your first circle ends, it shows here with how it went for you. That is what people check before they join your circles.
                      </p>
                    </div>
                  ) : (
                    <p className="empty-text">
                      No finished circles yet. When a circle ends, it shows here with how it went for this account.
                    </p>
                  )}
                </div>
              ) : (
                <div className="circle-rows-list">
                  {visiblePastCircles.map((c) => {
                    const parsedAmount = parseFloat(c.amount).toFixed(2);
                    const myMember = c.membersList?.find((m: any) => m.account === account);
                    const isOrganizer = c.organizer === account;
                    const endedDateStr = formatMonthYear(c.roundStart ? c.roundStart + c.periodSec : c.created);

                    let line3 = "";
                    let rightPill: React.ReactNode = null;

                    if (!myMember && isOrganizer) {
                      line3 = `Organized it, not a member. Ended ${endedDateStr}.`;
                      rightPill = <span className="status-pill status-neutral">Completed</span>;
                    } else if (myMember) {
                      const potStr = myMember.slot ? `Took the pot in round ${myMember.slot}. ` : "";
                      if (myMember.defaulted) {
                        line3 = `${potStr}Defaulted after the deposit ran out. Ended ${endedDateStr}.`;
                        rightPill = (
                          <span className="status-pill status-neutral" style={{ gap: "5px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", border: "1.5px solid currentColor" }} /> Defaulted
                          </span>
                        );
                      } else if (myMember.missed > 0) {
                        line3 = `${potStr}Ended ${endedDateStr}. ${myMember.missed === 1 ? "One payment" : `${myMember.missed} payments`} covered by the deposit.`;
                        rightPill = (
                          <span className="pill-missed-red">Missed {myMember.missed}</span>
                        );
                      } else {
                        line3 = `${potStr}Ended ${endedDateStr}.`;
                        rightPill = (
                          <span className="status-pill status-neutral" style={{ gap: "5px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#888" }} /> Completed
                          </span>
                        );
                      }
                    }

                    return (
                      <Link key={c.id} href={`/c/${c.id}`} className="circle-row-item">
                        <div className="row-content-left">
                          {/* Line 1 */}
                          <div className="row-line1">
                            <span className="row-circle-name">{c.name}</span>
                            {isOrganizer && (
                              <span className="pill-organizer-white">Organizer</span>
                            )}
                          </div>

                          {/* Line 2 */}
                          <div className="row-line2">
                            {c.maxMembers} members, {parsedAmount} USDC {getFrequencyText(c.periodSec)}.
                          </div>

                          {/* Line 3 */}
                          <div className="row-line3">{line3}</div>
                        </div>

                        {/* Right Pill & Chevron */}
                        <div className="row-right">
                          {rightPill}
                          <ChevronRight size={18} className="row-chevron" aria-hidden={true} />
                        </div>
                      </Link>
                    );
                  })}

                  {pastCircles.length > 10 && !showAllPast && (
                    <div style={{ padding: "16px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => setShowAllPast(true)}
                        className="btn-secondary"
                        style={{ height: "42px", padding: "0 20px" }}
                      >
                        Show all {pastCircles.length} circles
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SIDE COLUMN (320px on desktop) */}
          <div className="side-col">
            {/* OWNER ONLY: Share your profile (first) */}
            {isOwner && (
              <div className="card profile-card" style={{ padding: "24px" }}>
                <h2 className="side-card-title">Share your profile</h2>
                <p className="side-card-text">
                  Send this link with your invites, so people can see your record before they join.
                </p>

                <div className="share-input-row">
                  <label htmlFor="profile-share-link" className="sr-only">
                    Your profile link
                  </label>
                  <input
                    id="profile-share-link"
                    type="text"
                    readOnly
                    value={profileUrl}
                    className="share-readonly-input"
                  />
                  <button
                    type="button"
                    onClick={handleShareOrCopy}
                    className="btn-primary"
                    style={{ height: "48px", padding: "0 16px", gap: "6px", flexShrink: 0 }}
                  >
                    {copied ? (
                      <>
                        <Check size={16} /> Copied
                      </>
                    ) : canShare ? (
                      <>
                        <Share2 size={16} /> Share link
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy link
                      </>
                    )}
                  </button>
                </div>

                <div aria-live="polite" className="sr-only">
                  {copied ? "Link copied" : ""}
                </div>

                <p className="side-note-muted">
                  Others see this page the same way, without reminders and log out.
                </p>
              </div>
            )}

            {/* EVERYONE: Account card */}
            <div className="card profile-card" style={{ padding: "24px" }}>
              <h2 className="side-card-title">Account</h2>

              <dl className="account-stats-list">
                <div className="stat-row">
                  <dt>KYC</dt>
                  <dd style={{ fontWeight: 600, color: isKycVerified ? "#0B5A4E" : "var(--text)" }}>
                    {isKycVerified ? "Verified" : "Not verified"}
                  </dd>
                </div>

                <div className="stat-row">
                  <dt>XPR account since</dt>
                  <dd style={{ fontWeight: 600, color: "var(--text)" }}>
                    {formatMonthYear(accountCreated)}
                  </dd>
                </div>

                <div className="stat-row">
                  <dt>First circle</dt>
                  <dd style={{ fontWeight: 600, color: "var(--text)" }}>
                    {earliestSec ? formatMonthYear(earliestSec) : "None yet"}
                  </dd>
                </div>

                <div className="stat-row" style={{ borderBottom: "none" }}>
                  <dt>Circles organized</dt>
                  <dd style={{ fontWeight: 600, color: "var(--text)" }}>
                    {organizedCount}
                  </dd>
                </div>
              </dl>

              <div className="account-links-col">
                {isOwner && !isKycVerified && (
                  <a
                    href="https://webauth.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="account-link-item"
                  >
                    How to verify your account
                  </a>
                )}
                <a
                  href={`https://testnet.explorer.xprnetwork.org/account/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="account-link-item"
                >
                  View {account} on the explorer
                </a>
              </div>
            </div>

            {/* VISITOR ONLY: Saving with someone new? */}
            {!isOwner && (
              <div
                className="card"
                style={{
                  padding: "24px",
                  borderRadius: "20px",
                  background: "#E4EEEA",
                  border: "1px solid #CFE0D8",
                }}
              >
                <h2
                  className="side-card-title"
                  style={{ color: "#0A3D35", marginBottom: "8px" }}
                >
                  Saving with someone new?
                </h2>
                <p
                  style={{
                    color: "#2F4A43",
                    fontSize: "15px",
                    lineHeight: 1.5,
                    marginBottom: "16px",
                  }}
                >
                  A good record helps, but circles work best with people you know. Check that this account name is the one they gave you in your group chat. Names that look alike are not the same account.
                </p>
                <Link
                  href="/faq#reputation"
                  style={{
                    color: "#0A3D35",
                    fontWeight: 600,
                    fontSize: "14px",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  }}
                >
                  How reputation is counted →
                </Link>
              </div>
            )}

            {/* OWNER ONLY: Reminders card */}
            {isOwner && (
              <div className="card profile-card" style={{ padding: "24px" }}>
                <h2 className="side-card-title">Reminders</h2>
                <p className="side-card-text">
                  Get a Telegram message the day before each deadline, and when the pot is paid out.
                </p>
                <a
                  href={`https://t.me/artcircles_bot?start=${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{
                    width: "100%",
                    height: "44px",
                    justifyContent: "center",
                    gap: "8px",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                  }}
                >
                  <Bell size={16} /> Turn on Telegram reminders
                </a>
              </div>
            )}

            {/* OWNER ONLY: Log out */}
            {isOwner && (
              <button
                type="button"
                onClick={logout}
                className="btn-secondary"
                style={{
                  width: "100%",
                  height: "48px",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "20px",
                  border: "1px solid #E1E5E0",
                  background: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <LogOut size={16} /> Log out
              </button>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .profile-page-container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        /* Identity Block */
        .identity-block {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .avatar-circle {
          width: 80px;
          height: 80px;
          min-width: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-bricolage), sans-serif;
          font-size: 38px;
          font-weight: 700;
          text-transform: lowercase;
        }
        .name-kyc-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .account-h1 {
          font-family: var(--font-bricolage), sans-serif;
          font-weight: 800;
          font-size: clamp(34px, 5vw, 48px);
          line-height: 1.1;
          margin: 0;
          color: var(--text);
        }
        .kyc-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          height: 28px;
        }
        .kyc-verified {
          background: #E4EEEA;
          color: #0B5A4E;
        }
        .kyc-unverified {
          background: #EEF0EE;
          color: #3D4C50;
        }
        .unverified-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1.5px solid #3D4C50;
          display: inline-block;
        }
        .identity-subline {
          font-size: 17px;
          color: #3D4C50;
          margin: 0;
          line-height: 1.4;
        }

        /* Two columns grid */
        .profile-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .main-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }
        .side-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .profile-grid {
            max-width: 640px;
            margin: 0 auto;
          }
        }

        @media (min-width: 1024px) {
          .profile-grid {
            display: grid;
            grid-template-columns: 640px 320px;
            gap: 40px;
            align-items: start;
          }
          .main-col {
            max-width: 640px;
          }
          .side-col {
            max-width: 320px;
          }
        }

        @media (max-width: 767px) {
          .avatar-circle {
            width: 64px;
            height: 64px;
            min-width: 64px;
            font-size: 30px;
          }
          .account-h1 {
            font-size: 34px;
          }
        }

        /* Common Card styles */
        .profile-card {
          border-radius: 20px;
          border: 1px solid #E1E5E0;
          box-shadow: none;
          background: #FFFFFF;
          overflow: hidden;
        }
        .card-header-row {
          padding: 24px 24px 16px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .card-title-h2 {
          font-family: var(--font-bricolage), sans-serif;
          font-weight: 700;
          font-size: 20px;
          margin: 0;
          color: var(--text);
        }
        .card-count-label {
          font-size: 15px;
          color: #4F5E62;
        }
        .empty-state-container {
          padding: 32px 24px;
          text-align: center;
        }
        .empty-text {
          color: var(--text-secondary);
          font-size: 15px;
          margin: 0 0 12px;
          line-height: 1.5;
        }

        /* Circle rows */
        .circle-rows-list {
          display: flex;
          flex-direction: column;
        }
        .circle-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 28px;
          min-height: 72px;
          text-decoration: none;
          border-top: 1px solid #EEF0EE;
          transition: background 120ms ease;
          gap: 16px;
        }
        .circle-row-item:hover {
          background: #F9FAF8;
        }
        @media (max-width: 767px) {
          .circle-row-item {
            padding: 16px 20px;
          }
        }
        .row-content-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .row-line1 {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .row-circle-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
        }
        .pill-organizer-white {
          background: #FFFFFF;
          border: 1px solid #C9D2CE;
          color: #3D4C50;
          border-radius: var(--radius-full);
          padding: 2px 8px;
          font-size: 13px;
          font-weight: 600;
        }
        .pill-missed-red {
          background: #FBE9E7;
          color: #A3261B;
          border-radius: var(--radius-full);
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 600;
        }
        .pill-paid {
          background: #E4EEEA;
          color: #0B5A4E;
          border-radius: var(--radius-full);
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
        }
        .pill-unpaid {
          background: #FFF4EA;
          color: #7A3A08;
          border-radius: var(--radius-full);
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
        }
        .row-line2 {
          font-size: 15px;
          color: #3D4C50;
        }
        .row-line3 {
          font-size: 15px;
          color: #4F5E62;
          line-height: 1.4;
        }
        .row-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .row-chevron {
          color: var(--text-secondary);
        }

        /* Side Card elements */
        .side-card-title {
          font-family: var(--font-bricolage), sans-serif;
          font-weight: 700;
          font-size: 20px;
          margin: 0 0 8px;
          color: var(--text);
        }
        .side-card-text {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 16px;
        }
        .share-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .share-readonly-input {
          height: 48px;
          flex: 1;
          background: #F5F6F3;
          border: 1px solid #86928E;
          border-radius: var(--radius-md);
          padding: 0 12px;
          font-size: 14px;
          color: var(--text);
          font-family: inherit;
        }
        .side-note-muted {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        /* Account stats list */
        .account-stats-list {
          margin: 0 0 20px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #EEF0EE;
          font-size: 15px;
        }
        .stat-row dt {
          color: var(--text-secondary);
          margin: 0;
        }
        .stat-row dd {
          margin: 0;
        }
        .account-links-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .account-link-item {
          color: var(--brand);
          font-weight: 600;
          font-size: 14px;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}} />
    </>
  );
}
