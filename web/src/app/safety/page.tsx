import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { 
  ShieldCheck, 
  Lock, 
  Code2, 
  CheckCircle2, 
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { EXPLORER_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Safety & Trust Model - XPR Circles",
  description: "How XPR Circles protects your savings. Rules you can check on chain, who controls the contract, and verified official links.",
};

export default function SafetyPage() {
  return (
    <>
      <div className="container" style={{ paddingTop: "var(--space-64)", paddingBottom: "var(--space-80)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ marginBottom: "var(--space-48)" }}>
            <span className="text-label" style={{ color: "var(--brand)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              Trust & security
            </span>
            <h1 className="text-h1" style={{ fontSize: "clamp(34px, 4vw, 44px)", marginBottom: "var(--space-16)" }}>
              Rules you can check, not promises.
            </h1>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)" }}>
              Your money is held by the smart contract, not by a person. The contract has no function that lets anyone, including us, withdraw it outside the rules. On testnet the contract is already controlled by a 3-of-5 multisig. Before mainnet, the same setup moves to five independent XPR block producers.
            </p>
          </div>

          {/* Section 1: What we NEVER ask for */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-16)" }}>
              What we never ask for
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-20)" }}>
              People on XPR Network are rightfully protective against wallet drainers. To ensure your complete security, XPR Circles follows four non-negotiable rules:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    We never ask for account permissions
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    No <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>updateauth</code>, no <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>linkauth</code>, ever. If any website asking to be XPR Circles requests permission modifications, it is an impostor scam.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    Logging in signs a one-time check
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    When you log in, your wallet asks you to sign <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>artcircles · verify</code> with circles.artwebin.com and a random code. This proves the account is yours. It is never sent to the chain, moves no funds and changes no permissions. If a login ever asks you to sign a transfer or a permission change, it is not XPR Circles.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    We never hold your private keys
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    All signing happens inside the official WebAuth app. The website only requests transaction approvals that you confirm directly on your phone.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Code2 size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    Payouts happen even if this website disappears
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    Anyone can trigger a payout once a round deadline has passed. Our automated keeper triggers it within a minute, and the open smart contract ensures anyone can trigger payouts directly.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    We have no token and charge no fees
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    XPR Circles does not have a token. Any &quot;XPR Circles token&quot; or &quot;airdrop&quot; is a scam. 100% of the funds pooled go directly to that round&apos;s recipient.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Section 2: Who controls the contract */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-16)" }}>
              Who controls the contract
            </h2>
            <div className="card">
              <p className="text-body" style={{ fontSize: "15px", color: "var(--text)", marginBottom: "12px" }}>
                On testnet the contract is already controlled by a 3-of-5 multisig held by test accounts. Before mainnet, the same setup moves to five independent XPR block producers, and any change to the contract needs three of them to sign. You can check this yourself in the account’s permissions on the explorer.
              </p>
              <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
                The contract, the automated keeper, and the Telegram bot are open source on GitHub with 58 automated tests passing.
              </p>
            </div>
          </section>

          {/* Section 3: What happens if someone doesn't pay? */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-16)" }}>
              What happens if someone doesn&apos;t pay?
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
              In traditional offline savings circles, a member who stops paying after taking an early pot causes disputes and losses. On XPR Circles, the contract resolves this through two built-in mechanisms:
            </p>

            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 className="text-h3" style={{ fontSize: "18px", marginBottom: "8px" }}>
                1. The Security Deposit
              </h3>
              <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "12px" }}>
                To join a circle, each member deposits 1 to 3 rounds upfront. If someone misses their scheduled payment deadline, the contract automatically covers the round by deducting it from their deposit. The recipient still receives their full pot on time.
              </p>
              <div style={{ background: "var(--brand-subtle)", padding: "12px 16px", borderRadius: "var(--radius-sm)" }}>
                <p className="text-caption" style={{ color: "var(--brand)", fontWeight: 600 }}>
                  If a member pays all their rounds, their security deposit is returned in full at the end of the circle.
                </p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-h3" style={{ fontSize: "18px", marginBottom: "8px" }}>
                2. On-Chain Reputation
              </h3>
              <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                If a member exhausts their security deposit and still fails to pay, the missed round is permanently recorded on their on-chain account as a default. Everyone on XPR Network can see an account&apos;s past completed circles, missed payments, and defaults before admitting them into a new circle.
              </p>
            </div>
          </section>

          {/* Section 4: Official verified links */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-16)" }}>
              Verified official links
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
              Always check the URL in your browser address bar. XPR Circles only communicates through the following official channels:
            </p>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Official Web App</span>
                  <span className="text-caption">The only verified domain for saving and managing circles</span>
                </div>
                <a href="https://circles.artwebin.com" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  circles.artwebin.com <ExternalLink size={14} />
                </a>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Smart Contract Code</span>
                  <span className="text-caption">Open source, 58 automated tests passing</span>
                </div>
                <a href="https://github.com/artwebin/artcircles" target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  github.com/artwebin/artcircles <ExternalLink size={14} />
                </a>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Contract on XPR Testnet</span>
                  <span className="text-caption">Account name: artcircles</span>
                </div>
                <a href={`${EXPLORER_URL}/contract/artcircles`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Explorer <ExternalLink size={14} />
                </a>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Block Producer</span>
                  <span className="text-caption">Built by artwebin, block producer on XPR Network</span>
                </div>
                <a href="https://artwebin.com" target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  artwebin.com <ExternalLink size={14} />
                </a>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Telegram Reminders Bot</span>
                  <span className="text-caption">Sends automated payment notifications</span>
                </div>
                <a href="https://t.me/artcircles_bot" target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  @artcircles_bot <ExternalLink size={14} />
                </a>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Social (X / Twitter)</span>
                  <span className="text-caption">Official community updates</span>
                </div>
                <a href="https://x.com/XPRCircles" target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  @XPRCircles <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </section>

          {/* Testnet Note Card */}
          <div className="card" style={{ background: "var(--warning-bg)", borderColor: "#F2B07A", marginBottom: "var(--space-48)" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <AlertTriangle size={22} style={{ color: "var(--warning-text)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h3 className="text-h3" style={{ fontSize: "17px", color: "var(--warning-text)", marginBottom: "4px" }}>
                  Testnet environment
                </h3>
                <p className="text-body" style={{ color: "var(--warning-text)", fontSize: "14px" }}>
                  This application is currently live on XPR Network Testnet. All XUSDC tokens are test tokens and hold no monetary value. Mainnet deployment will occur following independent security review and multisig transfer to block producers.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div style={{ textAlign: "center" }}>
            <Link href="/how-it-works" className="btn-primary btn-large">
              Learn how it works
            </Link>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
