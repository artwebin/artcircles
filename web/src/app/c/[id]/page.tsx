import { Metadata } from "next";
import { getCircle, getMembers, getChainTime } from "@/lib/rpc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleActions } from "@/components/CircleActions";
import { InviteCard } from "@/components/InviteCard";
import { ChevronLeft, Check, Clock, MinusCircle } from "lucide-react";
import CircleRing, { RingMember } from "@/components/CircleRing";
import { CircleStatusRing } from "@/components/CircleStatusRing";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const circle = await getCircle(resolvedParams.id);
  if (!circle) return { title: "Circle not found", robots: { index: false } };

  const parsedAmount = parseFloat(circle.amount).toFixed(2);
  let periodText = "a round";
  if (circle.periodSec === 86400) periodText = "a day";
  if (circle.periodSec === 604800) periodText = "a week";
  if (circle.periodSec === 1209600) periodText = "every 2 weeks";
  if (circle.periodSec === 2592000) periodText = "a month";

  return {
    title: `${circle.name} - XPR Circles`,
    description: `${circle.organizer} invited you to ${circle.name}, ${circle.maxMembers} members, ${parsedAmount} USDC ${periodText}`,
    robots: { index: false }
  };
}

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const circle = await getCircle(resolvedParams.id);
  
  if (!circle) {
    notFound();
  }

  const members = await getMembers(resolvedParams.id);
  const chainTime = await getChainTime();

  const parsedAmount = parseFloat(circle.amount).toFixed(2);
  let periodText = "every round";
  if (circle.periodSec === 86400) periodText = "every day";
  if (circle.periodSec === 604800) periodText = "every week";
  if (circle.periodSec === 1209600) periodText = "every 2 weeks";
  if (circle.periodSec === 2592000) periodText = "every month";

  // Derived values
  const deadline = circle.roundStart + circle.periodSec;
  const recipient = members.find((m: any) => m.slot === circle.round);
  const fullPot = (parseFloat(circle.amount) * circle.maxMembers).toFixed(2);
  const totalPaid = (parseFloat(circle.amount) * members.filter((m: any) => m.paidRound === circle.round).length).toFixed(2);
  
  // Sort members by slot
  const sortedMembers = [...members].sort((a, b) => {
    if (a.slot === 0 && b.slot !== 0) return 1;
    if (b.slot === 0 && a.slot !== 0) return -1;
    return a.slot - b.slot;
  });

  const ringMembers: RingMember[] = sortedMembers.map((m: any) => ({
    account: m.account,
    paid: circle.state === 1 ? m.paidRound >= circle.round : circle.state === 2,
  }));
  const unpaidMembers = sortedMembers.filter((m: any) => m.paidRound < circle.round);

  return (
    <>
      <div className="container-app" style={{ paddingTop: "var(--space-40)", paddingBottom: "var(--space-80)" }}>
        
        <div className="circle-page-grid" style={{ gap: "var(--space-40)", alignItems: "start" }}>
          
            {/* MAIN COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
              
              {/* 1. Title Block */}
              <div>
                <Link href="/circles" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "24px", color: "var(--brand)" }}>
                  <ChevronLeft size={16}/> My circles
                </Link>
                
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                  <h1 className="text-h1">{circle.name}</h1>
                  {circle.state === 0 && <span className="status-pill status-neutral">● Waiting for members</span>}
                  {circle.state === 1 && <span className="status-pill status-paid"><div style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--brand)"}}></div> Active</span>}
                  {circle.state === 2 && <span className="status-pill status-paid">Completed</span>}
                </div>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                  Organized by {circle.organizer}. {circle.maxMembers} members, {parsedAmount} USDC {periodText}.
                </p>
              </div>

              {/* Action Card Placeholder (Replaced by CircleActions in browser) */}
              {/* For now, just render CircleActions directly so it works on client side */}
              <CircleActions 
                circleId={resolvedParams.id}
                circleState={circle.state}
                amount={circle.amount}
                depositRounds={circle.depositRounds}
                members={members}
                maxMembers={circle.maxMembers}
                currentRound={circle.round}
                organizer={circle.organizer}
              />

              {/* 2. Status Card */}
              {circle.state === 0 && (
                <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-32)", alignItems: "center", padding: "var(--space-32)" }}>
                  {ringMembers.length > 0 && (
                    <div style={{ flex: "0 0 240px", display: "flex", justifyContent: "center" }}>
                      <CircleStatusRing
                        members={ringMembers}
                        currentRound={0}
                        potAmount={fullPot}
                      />
                    </div>
                  )}
                  <div style={{ flex: "1 1 280px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                      <h3 className="text-h3">{members.length} of {circle.maxMembers} seats taken</h3>
                      <span className="text-caption" style={{ fontWeight: 600, color: "var(--brand)" }}>
                        {circle.maxMembers - members.length} {circle.maxMembers - members.length === 1 ? "seat" : "seats"} remaining
                      </span>
                    </div>
                    <div style={{ height: "8px", background: "var(--surface-muted)", borderRadius: "var(--radius-full)", marginBottom: "16px" }}>
                      <div style={{ 
                        height: '100%', 
                        background: 'var(--brand)', 
                        borderRadius: 'var(--radius-full)', 
                        width: `${(members.length / circle.maxMembers) * 100}%` 
                      }}></div>
                    </div>
                    <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                      {members.length < circle.maxMembers 
                        ? "Share the invite link with your members so they can join with their security deposit." 
                        : members.every((m: any) => m.approved === 1) 
                          ? "All members have approved the payout order. The organizer can now start the circle."
                          : members.some((m: any) => m.slot !== 0)
                            ? "Waiting for all members to approve the payout order."
                            : "All seats are filled! Waiting for the organizer to set the payout order."}
                    </p>
                  </div>
                </div>
              )}

              {(circle.state === 1 || circle.state === 2) && (
                <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-32)", alignItems: "center", padding: "var(--space-32)" }}>
                  <div style={{ flex: "0 0 240px", display: "flex", justifyContent: "center" }}>
                    <CircleStatusRing
                      members={ringMembers}
                      currentRound={circle.state === 1 ? circle.round : circle.maxMembers}
                      potAmount={fullPot}
                    />
                  </div>
                  <div style={{ flex: "1 1 280px" }}>
                    <p className="text-label" style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Round {circle.round} of {circle.maxMembers}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                      <span className="text-amount">{fullPot} USDC</span>
                      <span className="text-h2" style={{ color: "var(--pot-text)" }}>to {recipient ? recipient.account : 'someone'}</span>
                    </div>
                    <p className="text-caption" style={{ marginBottom: "24px" }}>
                      {circle.state === 2 ? "Circle completed." : "Paid out automatically at deadline."}
                    </p>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="text-label">{members.filter((m: any) => m.paidRound >= circle.round).length} of {circle.maxMembers} have paid this round</span>
                      <span className="text-caption">{totalPaid} of {fullPot}</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--surface-muted)", borderRadius: "var(--radius-full)", marginBottom: "12px" }}>
                      <div style={{ 
                        height: '100%', 
                        background: 'var(--brand)', 
                        borderRadius: 'var(--radius-full)', 
                        width: `${(members.filter((m: any) => m.paidRound >= circle.round).length / circle.maxMembers) * 100}%` 
                      }}></div>
                    </div>
                    {circle.state === 1 && unpaidMembers.length > 0 && (
                      <p className="text-caption">
                        Still to pay: {unpaidMembers.map((m: any) => m.account).join(", ")}.
                      </p>
                    )}
                    {circle.state === 1 && unpaidMembers.length === 0 && (
                      <p className="text-caption" style={{ color: "var(--brand)" }}>
                        All members have paid this round.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Payout order */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: "1px solid var(--border)" }}>
                  <h3 className="text-h3">Payout order</h3>
                  <span className="text-caption">Approved by all {circle.maxMembers} members</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {sortedMembers.map((m: any, index: number) => {
                    const isPaid = m.paidRound === circle.round;
                    const isCurrentRecipient = m.slot === circle.round && circle.state === 1;
                    const hasDefaulted = m.defaulted === 1;

                    return (
                      <div key={m.account} style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)", background: isCurrentRecipient ? "var(--pot-subtle)" : "var(--surface)" }}>
                        <div style={{ width: "32px", fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>
                          {m.slot !== 0 ? m.slot : (index + 1)}
                        </div>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: isCurrentRecipient ? "var(--pot-strong)" : "var(--brand-subtle)", color: isCurrentRecipient ? "#FFF" : "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", marginRight: "16px" }}>
                          {m.account[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{m.account}</div>
                          <div className="text-caption" style={{ color: isCurrentRecipient ? "var(--pot-text)" : "var(--text-secondary)" }}>
                            {m.slot !== 0 ? `Takes the pot Fri ${10 + m.slot * 7} Oct` : 'Joined'}
                          </div>
                        </div>
                        
                        <div>
                          {hasDefaulted ? (
                            <span className="status-pill status-neutral"><MinusCircle size={14}/> Defaulted</span>
                          ) : isPaid ? (
                            <span className="status-pill status-paid"><Check size={14}/> Paid this round</span>
                          ) : isCurrentRecipient ? (
                            <span className="status-pill" style={{ background: "var(--pot)", color: "var(--pot-text)" }}>Takes the pot now</span>
                          ) : (
                            <span className="status-pill status-neutral"><Clock size={14}/> Not paid yet</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 5. History */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: "24px" }}>
                  <h3 className="text-h3">History</h3>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", padding: "16px 24px", borderBottom: "1px solid var(--border)", gap: "16px", alignItems: "start" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--pot-strong)", marginTop: "6px" }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, marginBottom: "4px" }}>Round 2 paid out: dan got 200.00 USDC</p>
                      <p className="text-caption">Fri 10 Oct, 18:00 CEST</p>
                    </div>
                    <a href="#" style={{ color: "var(--brand)", textDecoration: "underline", textUnderlineOffset: "4px", fontSize: "14px", fontWeight: 500 }}>Transaction</a>
                  </div>
                  <div style={{ display: "flex", padding: "16px 24px", borderBottom: "1px solid var(--border)", gap: "16px", alignItems: "start" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--pot-strong)", marginTop: "6px" }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, marginBottom: "4px" }}>Round 1 paid out: alice got 200.00 USDC</p>
                      <p className="text-caption">Fri 3 Oct, 18:00 CEST</p>
                    </div>
                    <a href="#" style={{ color: "var(--brand)", textDecoration: "underline", textUnderlineOffset: "4px", fontSize: "14px", fontWeight: 500 }}>Transaction</a>
                  </div>
                  <div style={{ display: "flex", padding: "16px 24px", gap: "16px", alignItems: "start" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand)", marginTop: "6px" }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, marginBottom: "4px" }}>Circle started. All 8 members approved the order.</p>
                      <p className="text-caption">Thu 2 Oct, 20:14 CEST</p>
                    </div>
                    <a href="#" style={{ color: "var(--brand)", textDecoration: "underline", textUnderlineOffset: "4px", fontSize: "14px", fontWeight: 500 }}>Transaction</a>
                  </div>
                </div>
              </div>

            </div>
            
            {/* SIDE COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
              {/* Invite Card (When forming) */}
              {circle.state === 0 && (
                <InviteCard
                  circleId={resolvedParams.id}
                  circleName={circle.name}
                  seatsRemaining={circle.maxMembers - members.length}
                />
              )}

              {/* Your part (When active or completed) */}
              {(circle.state === 1 || circle.state === 2) && (
                <div className="card">
                  <h3 className="text-h3" style={{ marginBottom: "24px" }}>Your part</h3>
                  <div style={{ background: "var(--brand-subtle)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "24px" }}>
                    <p className="text-caption" style={{ marginBottom: "4px" }}>You take the pot</p>
                    <p className="text-h2" style={{ marginBottom: "8px", color: "var(--brand)" }}>Round 4, Fri 24 Oct</p>
                    <p className="text-caption">200.00 USDC, sent to you automatically</p>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>Paid so far</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>50.00 of 200.00</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>Security deposit</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>25.00 held</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "16px", marginBottom: "8px" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>Missed payments</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>None</span>
                  </div>
                  <p className="text-caption">Your deposit comes back when the circle ends.</p>
                </div>
              )}

              {/* Reminders */}
              <div className="card">
                <h3 className="text-h3" style={{ marginBottom: "12px" }}>Reminders</h3>
                <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                  Get a Telegram message the day before each deadline, and when the pot is paid out.
                </p>
                <Link href="/reminders" className="btn-secondary" style={{ width: "100%", gap: "8px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 22-7-5-3 5-1-6 12-14z"></path></svg>
                  Turn on Telegram reminders
                </Link>
              </div>

              {/* Circle details */}
              <div className="card">
                <h3 className="text-h3" style={{ marginBottom: "24px" }}>Circle details</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>Each round</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>{parsedAmount} USDC</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>How often</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>{periodText}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>Pot</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>{fullPot} USDC</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>Security deposit</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>{(parseFloat(circle.amount) * circle.depositRounds).toFixed(2)} USDC</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>Members</span>
                    <span className="text-body" style={{ fontWeight: 700 }}>{circle.maxMembers}</span>
                  </div>
                </div>
                
                <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Link href="/safety" style={{ color: "var(--brand)", textDecoration: "underline", textUnderlineOffset: "4px", fontWeight: 500, fontSize: "14px" }}>What happens if someone doesn't pay</Link>
                  <a href={`https://testnet.explorer.xprnetwork.org/contract/artcircles`} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", textDecoration: "underline", textUnderlineOffset: "4px", fontWeight: 500, fontSize: "14px" }}>View this circle on the explorer</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      <Footer slim />
      <style dangerouslySetInnerHTML={{__html: `
        .container-app {
          max-width: 1184px !important;
        }
        .circle-page-grid {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 1024px) {
          .circle-page-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
          }
        }
      `}} />
    </>
  );
}
