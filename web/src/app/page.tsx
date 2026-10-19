import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Check } from "lucide-react";
import CircleRing, { HERO_EXAMPLE } from "@/components/CircleRing";
import { PROOF_CIRCLE_ID, EXPLORER_URL, CHAIN } from "@/lib/config";

export default function LandingPage() {
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

      <div style={{ background: "var(--bg)" }}>
        <div className="container" style={{ paddingTop: "var(--space-120)", paddingBottom: "var(--space-120)" }}>
          {/* 3. Four steps */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "var(--space-64)" }}>
            <div>
              <h2 className="text-h2" style={{ marginBottom: "var(--space-24)", maxWidth: "300px" }}>Four steps, then it runs on its own.</h2>
              <p className="text-body-lg" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-32)", maxWidth: "340px" }}>
                The organizer sets it up once. After that, payouts and reminders happen by themselves.
              </p>
              <Link href="/how-it-works" className="btn-ghost" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>Read the full guide</Link>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
              {/* Step 1 */}
              <div className="card" style={{ display: "flex", gap: "var(--space-24)", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", marginBottom: "16px" }}>1</div>
                  <h3 className="text-h3" style={{ marginBottom: "8px" }}>Create the circle</h3>
                  <p className="text-caption">Choose the amount, how often, and how many people. You see the pot before you share anything.</p>
                </div>
                <div style={{ flex: 1, background: "var(--bg)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <p style={{ fontWeight: 700, marginBottom: "12px" }}>8 members, 25.00 USDC every week</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}><span style={{ color: "var(--text-secondary)" }}>Pot each week</span><strong>200.00 USDC</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}><span style={{ color: "var(--text-secondary)" }}>Security deposit</span><strong>25.00 USDC</strong></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="card" style={{ display: "flex", gap: "var(--space-24)", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", marginBottom: "16px" }}>2</div>
                  <h3 className="text-h3" style={{ marginBottom: "8px" }}>Share one link</h3>
                  <p className="text-caption">Send it to your family or friends group. People join with one payment: a security deposit they get back at the end.</p>
                </div>
                <div style={{ flex: 1, padding: "16px" }}>
                  <div style={{ display: "flex", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ padding: "8px 12px", background: "var(--surface)", flex: 1, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>circles.artwebin.com/...</div>
                    <div style={{ padding: "8px 12px", background: "var(--brand)", color: "white", fontSize: "13px", fontWeight: 500 }}>Copy link</div>
                  </div>
                  <div style={{ height: "4px", background: "var(--surface-muted)", borderRadius: "2px", marginBottom: "4px" }}>
                    <div style={{ width: "62%", height: "100%", background: "var(--brand)", borderRadius: "2px" }}></div>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>5 of 8 seats taken</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="card" style={{ display: "flex", gap: "var(--space-24)", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", marginBottom: "16px" }}>3</div>
                  <h3 className="text-h3" style={{ marginBottom: "8px" }}>Agree on the order</h3>
                  <p className="text-caption">The organizer proposes who takes the pot when. Everyone approves it themselves before anything starts.</p>
                </div>
                <div style={{ flex: 1, padding: "16px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", fontWeight: 500 }}>
                    <div style={{ display: "flex", gap: "12px" }}><span>1</span><span>alice</span></div>
                    <span className="status-pill status-paid" style={{ transform: "scale(0.8)", transformOrigin: "right" }}><Check size={12}/> Approved</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", fontWeight: 500 }}>
                    <div style={{ display: "flex", gap: "12px" }}><span>2</span><span>dan</span></div>
                    <span className="status-pill status-paid" style={{ transform: "scale(0.8)", transformOrigin: "right" }}><Check size={12}/> Approved</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 500 }}>
                    <div style={{ display: "flex", gap: "12px" }}><span>3</span><span>bob</span></div>
                    <span className="status-pill status-neutral" style={{ transform: "scale(0.8)", transformOrigin: "right" }}>Waiting</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="card" style={{ display: "flex", gap: "var(--space-24)", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", marginBottom: "16px" }}>4</div>
                  <h3 className="text-h3" style={{ marginBottom: "8px" }}>Pay each round, take the pot once</h3>
                  <p className="text-caption">Pay your share before the deadline, with a Telegram reminder the day before. When it's your turn, the pot arrives on its own.</p>
                </div>
                <div style={{ flex: 1, padding: "16px", background: "var(--warning-bg)", borderRadius: "var(--radius-md)", border: "1px solid #F2B07A" }}>
                  <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--warning-text)", marginBottom: "4px" }}>Your payment of 25.00 USDC is due in 2 days</p>
                  <p style={{ fontSize: "12px", color: "var(--warning-text)", marginBottom: "12px", opacity: 0.8 }}>Fri 17 Oct, 18:00 CEST</p>
                  <button className="btn-primary btn-small" style={{ width: "100%" }}>Pay 25.00 USDC</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

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
                <p className="text-body" style={{ color: "var(--on-deep-muted)" }}>Anyone can trigger a payout once a round is due. Our keeper does it within a minute of the deadline, and its code is public so anyone can run their own.</p>
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
          
          <div className="card" style={{ padding: 0, marginBottom: "32px" }}>
            {/* Event 1 */}
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", gap: "24px" }}>
              <div style={{ width: "120px", flexShrink: 0, fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>5 Oct 2026</div>
              <div style={{ flex: 1 }}>
                <h3 className="text-h3" style={{ marginBottom: "8px" }}>Circle #0 completed</h3>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>Three members, three rounds, everyone paid on time. Each received the pot once and got their deposit back.</p>
              </div>
              <div style={{ alignSelf: "start" }}>
                <a href="#" className="btn-ghost" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>View the contract</a>
              </div>
            </div>
            
            {/* Event 2 */}
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", gap: "24px" }}>
              <div style={{ width: "120px", flexShrink: 0, fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>6 Oct, 09:27</div>
              <div style={{ flex: 1 }}>
                <h3 className="text-h3" style={{ marginBottom: "8px" }}>Circle #1, round 1 paid out</h3>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>One member missed the deadline. Their deposit covered it and the pot was paid in full.</p>
              </div>
              <div style={{ alignSelf: "start" }}>
                <a href="#" className="btn-ghost" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>View transaction</a>
              </div>
            </div>
            
            {/* Event 3 */}
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", gap: "24px" }}>
              <div style={{ width: "120px", flexShrink: 0, fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>7 Oct, 09:26</div>
              <div style={{ flex: 1 }}>
                <h3 className="text-h3" style={{ marginBottom: "8px" }}>Circle #1, round 2 paid out</h3>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>The same member missed again with no deposit left. It was recorded as their debt, and that round's pot was smaller.</p>
              </div>
              <div style={{ alignSelf: "start" }}>
                <a href="#" className="btn-ghost" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>View the contract</a>
              </div>
            </div>
            
            {/* Event 4 */}
            <div style={{ padding: "24px", display: "flex", gap: "24px" }}>
              <div style={{ width: "120px", flexShrink: 0, fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>8 Oct, 09:26</div>
              <div style={{ flex: 1 }}>
                <h3 className="text-h3" style={{ marginBottom: "8px" }}>Circle #1 completed</h3>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>The debt was held back from that member's own pot and paid to the member who got less. All three ended with exactly 100.00.</p>
              </div>
              <div style={{ alignSelf: "start" }}>
                <a href="#" className="btn-ghost" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>View transaction</a>
              </div>
            </div>
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
