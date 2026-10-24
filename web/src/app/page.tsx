import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Check } from "lucide-react";
import CircleRing, { HERO_EXAMPLE } from "@/components/CircleRing";
import { PROOF_CIRCLE_ID, EXPLORER_URL, CHAIN, PROOF_EVENTS } from "@/lib/config";
import HowItWorksSteps from "@/components/HowItWorksSteps";
import { getCirclesEvents, CircleEvent } from "@/lib/history";
import ClientDeadline from "@/components/ClientDeadline";

export default async function LandingPage() {
  // Fetch on-chain events for circles referenced in PROOF_EVENTS in a single Hyperion query pass
  const circleIds = Array.from(new Set(PROOF_EVENTS.map((p) => p.circle)));
  const eventsByCircle = await getCirclesEvents(circleIds);

  const proofRows = PROOF_EVENTS.map((item) => {
    const events = eventsByCircle[item.circle] || [];
    const matched = events.find((e) => {
      if (item.type === "completed") {
        return e.type === "completed";
      }
      if (item.type === "payout" && "round" in item) {
        return e.type === "payout" && e.round === item.round;
      }
      return false;
    });

    const timestampSec = matched?.timestamp
      ? Math.floor(new Date(matched.timestamp).getTime() / 1000)
      : null;

    return {
      ...item,
      trxId: matched?.trxId || null,
      timestampSec,
    };
  });

  return (
    <>
      <div className="container" style={{ paddingTop: "var(--space-80)", paddingBottom: "var(--space-80)" }}>
        
        {/* 1. Hero */}
        <section className="hero-grid">
          <div>
            <h1 className="text-display" style={{ marginBottom: "var(--space-24)", whiteSpace: "nowrap" }}>
              Save together<br/>with people<br/>you trust.
            </h1>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-40)", maxWidth: "480px" }}>
              Everyone in the circle pays the same amount each round, and each round one person takes the whole pot. XPR Circles holds the money and keeps the order and the deadlines, so nobody has to.
            </p>
            <div style={{ display: "flex", gap: "var(--space-16)", flexWrap: "wrap", marginBottom: "var(--space-24)" }}>
              <Link href="/new" className="btn-primary btn-large">Create a circle</Link>
              <Link href="/how-it-works" className="btn-secondary btn-large">How it works</Link>
            </div>
            <div style={{ display: "flex", gap: "var(--space-24)", flexWrap: "wrap", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} color="var(--text)"/> No interest</span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} color="var(--text)"/> No fees</span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} color="var(--text)"/> We never ask for your account permissions</span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CircleRing {...HERO_EXAMPLE} animate loop />
            <p className="text-caption" style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "var(--space-20)", maxWidth: "420px" }}>
              A circle of eight paying 25.00 USDC a week. Round 3: bob takes the pot, and the checks show who has paid.
            </p>
          </div>
        </section>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="container" style={{ paddingTop: "var(--space-120)", paddingBottom: "var(--space-120)" }}>
          {/* 2. Everyone pays the same */}
          <section style={{ marginBottom: "var(--space-120)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-64)", marginBottom: "var(--space-64)" }}>
              <h2 className="text-h2" style={{ maxWidth: "400px" }}>Everyone pays the same. Everyone takes the pot once.</h2>
              <div style={{ alignSelf: "end" }}>
                <p className="text-body-lg" style={{ color: "var(--text-secondary)" }}>
                  Five friends agree to pay 100 every month. Each month one of them takes the pot of 500.
                </p>
              </div>
            </div>

            <div style={{ position: "relative", paddingTop: "24px", overflowX: "auto", paddingBottom: "24px" }}>
              <div style={{ position: "absolute", top: "28px", left: "20px", right: "20px", height: "1px", background: "var(--border-strong)", zIndex: 0 }}></div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(180px, 1fr))", gap: "24px", position: "relative", zIndex: 1 }}>
                
                {[
                  { m: "January", n: "Alice", t: "takes 500", c: "#47C2A7" },
                  { m: "February", n: "Bob", t: "takes 500", c: "#E9A93B" },
                  { m: "March", n: "Charlie", t: "takes 500", c: "#E9A93B" },
                  { m: "April", n: "Dave", t: "takes 500", c: "#47C2A7" },
                  { m: "May", n: "Eve", t: "takes 500", c: "#47C2A7" }
                ].map((step, i) => (
                  <div key={i}>
                    <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--brand)", marginBottom: "16px" }}></div>
                    <p className="text-label" style={{ marginBottom: "2px" }}>{step.m}</p>
                    <p className="text-caption" style={{ marginBottom: "16px" }}>Everyone pays 100</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: step.c === "#E9A93B" ? "var(--pot-subtle)" : "var(--brand-subtle)", color: step.c === "#E9A93B" ? "var(--pot-strong)" : "var(--brand)", border: `2px solid ${step.c}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px" }}>
                        {step.n[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "18px", lineHeight: 1.2 }}>{step.n}</p>
                        <p style={{ fontSize: "14px", color: step.c === "#E9A93B" ? "var(--pot-text)" : "var(--text)", fontWeight: 500 }}>{step.t}</p>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
            
            <p className="text-body" style={{ color: "var(--text-secondary)", maxWidth: "800px", marginTop: "32px" }}>
              After five months everyone has paid 500 and received 500. Nobody pays interest and nobody earns it. Alice got hers first, like an interest-free loan from her friends. Eve saved for five months and got it all at once.
            </p>
          </section>
        </div>
      </div>

      {/* 3. Four steps (scrollytelling) */}
      <HowItWorksSteps />

      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="container" style={{ paddingTop: "var(--space-120)", paddingBottom: "var(--space-120)" }}>
          {/* 4. Not paying */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "var(--space-64)", alignItems: "center" }}>
            <div>
              <h2 className="text-h2" style={{ marginBottom: "var(--space-24)" }}>Not paying never pays off.</h2>
              <p className="text-body-lg" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-32)" }}>
                Most circles break when someone takes the pot and stops paying. Here the rules are part of the contract, and everyone can read them before joining.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
                <li style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <p className="text-body">A missed payment is taken from that member's security deposit. The pot is paid in full.</p>
                </li>
                <li style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  </div>
                  <p className="text-body">With no deposit left, the missed amount becomes their debt, and that round's pot is smaller.</p>
                </li>
                <li style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>
                  </div>
                  <p className="text-body">When their own turn comes, the debt is held back from their pot and paid to the people they shorted.</p>
                </li>
              </ul>
              <p className="text-caption">Every default stays on the account's public record.</p>
            </div>
            
            <div className="card" style={{ background: "var(--bg)", border: "none" }}>
              <h3 className="text-h3" style={{ marginBottom: "8px" }}>Testnet circle #{PROOF_CIRCLE_ID}</h3>
              <p className="text-caption" style={{ marginBottom: "24px" }}>Three members, 10.00 USDC a round. Member C stopped paying on purpose.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <div style={{ display: "flex", padding: "16px", background: "var(--surface)", gap: "16px" }}>
                  <div style={{ fontWeight: 700, width: "60px", fontSize: "14px" }}>Round 1</div>
                  <div style={{ flex: 1, fontSize: "14px" }}>C misses the deadline. C's security deposit covers it.</div>
                  <div style={{ background: "var(--pot-subtle)", color: "var(--pot-text)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, alignSelf: "start" }}>A gets 30.00</div>
                </div>
                <div style={{ display: "flex", padding: "16px", background: "var(--surface)", gap: "16px" }}>
                  <div style={{ fontWeight: 700, width: "60px", fontSize: "14px" }}>Round 2</div>
                  <div style={{ flex: 1, fontSize: "14px" }}>C misses again with no deposit left. Recorded as a 10.00 debt.</div>
                  <div style={{ background: "var(--pot-subtle)", color: "var(--pot-text)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, alignSelf: "start" }}>B gets 20.00</div>
                </div>
                <div style={{ display: "flex", padding: "16px", background: "var(--surface)", gap: "16px" }}>
                  <div style={{ fontWeight: 700, width: "60px", fontSize: "14px" }}>Round 3</div>
                  <div style={{ flex: 1, fontSize: "14px" }}>C's own turn. The 10.00 debt is held back from C's pot.</div>
                  <div style={{ background: "var(--pot-subtle)", color: "var(--pot-text)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, alignSelf: "start" }}>C gets 10.00</div>
                </div>
                <div style={{ display: "flex", padding: "16px", background: "var(--surface)", gap: "16px" }}>
                  <div style={{ fontWeight: 700, width: "60px", fontSize: "14px" }}>End</div>
                  <div style={{ flex: 1, fontSize: "14px" }}>B is paid back the 10.00. Everyone ends with exactly what they started with.</div>
                  <div style={{ background: "var(--brand-subtle)", color: "var(--brand)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, alignSelf: "start" }}>All at 100.00</div>
                </div>
              </div>
              
              <div style={{ marginTop: "24px" }}>
                <Link href={`/c/${PROOF_CIRCLE_ID}`} style={{ color: "var(--brand)", fontWeight: 500, fontSize: "14px", textDecoration: "underline", textUnderlineOffset: "4px" }}>See the transactions</Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 5. Safety/Trust */}
      <div style={{ background: "var(--deep)", color: "var(--on-deep)" }}>
        <div className="container" style={{ paddingTop: "var(--space-120)", paddingBottom: "var(--space-120)" }}>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "var(--space-80)" }}>
            <div>
              <h2 className="text-h2" style={{ marginBottom: "var(--space-64)", color: "var(--on-deep)" }}>Rules you can check,<br/>not promises.</h2>
              
              <div style={{ marginBottom: "var(--space-48)" }}>
                <h3 className="text-h3" style={{ marginBottom: "12px", color: "var(--on-deep)" }}>Who controls the contract</h3>
                <p className="text-body" style={{ color: "var(--on-deep-muted)" }}>
                  On testnet the contract is already controlled by a 3-of-5 multisig held by test accounts. Before mainnet, the same setup moves to five independent XPR block producers, and any change to the contract needs three of them to sign. You can check this yourself in the account’s permissions on the explorer.
                </p>
              </div>

              <div style={{ marginBottom: "var(--space-48)" }}>
                <h3 className="text-h3" style={{ marginBottom: "12px", color: "var(--on-deep)" }}>We never ask for your account permissions.</h3>
                <p className="text-body" style={{ color: "var(--on-deep-muted)" }}>Joining and paying are normal payments. If anything calling itself XPR Circles asks to change your permissions, it is not us.</p>
              </div>
              
              <div style={{ marginBottom: "var(--space-48)" }}>
                <h3 className="text-h3" style={{ marginBottom: "12px", color: "var(--on-deep)" }}>Payouts happen even if we disappear.</h3>
                <p className="text-body" style={{ color: "var(--on-deep-muted)" }}>The pot is paid out as soon as everyone has paid, or automatically at the deadline by our keeper within a minute, and its code is public so anyone can run their own.</p>
              </div>
              
              <div>
                <h3 className="text-h3" style={{ marginBottom: "12px", color: "var(--on-deep)" }}>The rules are open code.</h3>
                <p className="text-body" style={{ color: "var(--on-deep-muted)" }}>The contract, the keeper and the reminder bot are on GitHub, with 48 tests covering every rule on this page.</p>
              </div>
            </div>
            
            <div>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-lg)", padding: "var(--space-32)" }}>
                <h3 className="text-h3" style={{ marginBottom: "16px", color: "var(--on-deep)" }}>Official links</h3>
                <p className="text-caption" style={{ color: "var(--on-deep-muted)", marginBottom: "32px" }}>Only these are us. Check the address before you log in or pay.</p>
                
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
                  <li><a href="https://circles.artwebin.com" style={{ color: "var(--on-deep-link)", textDecoration: "underline", textUnderlineOffset: "4px" }}>circles.artwebin.com</a></li>
                  <li><a href="https://github.com/artwebin/artcircles" style={{ color: "var(--on-deep-link)", textDecoration: "underline", textUnderlineOffset: "4px" }}>github.com/artwebin/artcircles</a></li>
                  <li><a href="https://x.com/XPRCircles" style={{ color: "var(--on-deep-link)", textDecoration: "underline", textUnderlineOffset: "4px" }}>x.com/XPRCircles</a></li>
                  <li><a href="https://t.me/artcircles_bot" style={{ color: "var(--on-deep-link)", textDecoration: "underline", textUnderlineOffset: "4px" }}>t.me/artcircles_bot</a></li>
                  <li><a href={`${EXPLORER_URL}/contract/artcircles`} target="_blank" rel="noreferrer" style={{ color: "var(--on-deep-link)", textDecoration: "underline", textUnderlineOffset: "4px" }}>Contract on XPR {CHAIN === "mainnet" ? "Mainnet" : "Testnet"}</a></li>
                </ul>
                
                <p className="text-label" style={{ color: "var(--on-deep)", fontWeight: 700 }}>XPR Circles has no token. Any XPR Circles token or airdrop is a scam.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div style={{ background: "var(--bg)" }}>
        <div className="container" style={{ paddingTop: "var(--space-120)", paddingBottom: "var(--space-120)" }}>
          {/* 6. Proof */}
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-64)", marginBottom: "var(--space-120)", alignItems: "start" }}>
            <h2 className="text-h2">Already tested on chain.</h2>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)" }}>
              Two circles ran on XPR testnet. The contract held the money, the keeper paid every round within a minute of the deadline, and the bot sent every reminder. Nobody stepped in.
            </p>
          </section>
          
          <div className="card proof-card">
            {proofRows.map((item, idx) => (
              <div key={idx} className="proof-row">
                <div className="proof-date-col">
                  {item.timestampSec ? (
                    <ClientDeadline deadlineSec={item.timestampSec} />
                  ) : null}
                </div>
                <div className="proof-content-col">
                  <Link href={`/c/${item.circle}`} className="proof-title-link">
                    <h3 className="text-h3">{item.title}</h3>
                  </Link>
                  <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                    {item.text}
                  </p>
                </div>
                <div className="proof-link-col">
                  {item.trxId ? (
                    <a
                      href={`${EXPLORER_URL}/transaction/${item.trxId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost"
                      style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
                    >
                      View transaction
                    </a>
                  ) : (
                    <Link
                      href={`/c/${item.circle}`}
                      className="btn-ghost"
                      style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
                    >
                      View circle
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-caption">All code is open source. <a href="https://github.com/artwebin/artcircles" style={{ color: "var(--brand)", textDecoration: "underline", textUnderlineOffset: "4px", fontWeight: 500 }}>Read it on GitHub</a></p>

        </div>
      </div>

      <div className="container" style={{ paddingBottom: "var(--space-120)" }}>
        {/* 7. Final call */}
        <section style={{ background: "var(--brand-subtle)", borderRadius: "var(--radius-xl)", padding: "var(--space-64)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "var(--space-48)", alignItems: "center" }}>
          <div>
            <h2 className="text-h2" style={{ marginBottom: "var(--space-24)", color: "var(--brand)" }}>Start a circle with the people you already save with.</h2>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)" }}>You need an XPR account and a few minutes. Your members only need the link.</p>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link href="/new" className="btn-primary btn-large">Create a circle</Link>
            <Link href="/faq" className="btn-secondary btn-large" style={{ background: "var(--surface)", border: "none" }}>Read the FAQ</Link>
          </div>
        </section>
      </div>
      
      <Footer />
    </>
  );
}
