import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { 
  Users, 
  Coins, 
  ShieldCheck, 
  Calendar, 
  Sparkles,
  CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works - XPR Circles",
  description: "Learn how decentralized savings circles work on XPR Network. Zero interest, no bank, no middleman, with automated on-chain payouts.",
};

export default function HowItWorksPage() {
  return (
    <>
      <div className="container" style={{ paddingTop: "var(--space-64)", paddingBottom: "var(--space-80)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ marginBottom: "var(--space-48)" }}>
            <span className="text-label" style={{ color: "var(--brand)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              The concept
            </span>
            <h1 className="text-h1" style={{ fontSize: "clamp(34px, 4vw, 44px)", marginBottom: "var(--space-16)" }}>
              Save together with people you trust.
            </h1>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)" }}>
              A savings circle (known globally as a <em>tanda</em>, <em>susu</em>, or <em>equb</em>) is a time-tested community method where a small group pools money regularly, and each round one person takes the entire pot.
            </p>
          </div>

          {/* Section 1: The Example */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-16)" }}>
              How it works in practice
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-20)" }}>
              Imagine five friends who want to save together. They agree to contribute <strong>100 USDC each month</strong> for 5 months:
            </p>

            {/* Example Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--space-20)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "15px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Month</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Everyone pays</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Takes the pot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>1</td>
                    <td style={{ padding: "12px 16px" }}>100 USDC</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--brand)" }}>Alice (500 USDC)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>2</td>
                    <td style={{ padding: "12px 16px" }}>100 USDC</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--brand)" }}>Bob (500 USDC)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>3</td>
                    <td style={{ padding: "12px 16px" }}>100 USDC</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--brand)" }}>Charlie (500 USDC)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>4</td>
                    <td style={{ padding: "12px 16px" }}>100 USDC</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--brand)" }}>Dave (500 USDC)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>5</td>
                    <td style={{ padding: "12px 16px" }}>100 USDC</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--brand)" }}>Eve (500 USDC)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: "var(--brand-subtle)", padding: "16px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <p className="text-body" style={{ color: "var(--brand)", fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>
                Nobody gains or loses money. What changes is timing.
              </p>
              <p className="text-caption" style={{ color: "var(--text)" }}>
                Alice gets an interest-free loan in month 1 to cover an immediate expense, which she repays over 4 months. Eve saves steadily and receives 500 USDC at once in month 5 for a planned purchase.
              </p>
            </div>
          </section>

          {/* Section 2: Step-by-Step Flow */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-20)" }}>
              How it works on XPR Network
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div className="card" style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    Create and share one link
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    The organizer sets the payment amount, frequency (daily, weekly, bi-weekly, or monthly) and number of seats, then sends the link to friends or family via WhatsApp or Telegram.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    Join with a security deposit
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    Each member deposits 1 to 3 rounds into the smart contract. This deposit stays in the contract to protect everyone against missed payments, and is refunded in full at the end.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    Everyone approves the payout order
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    Before the circle can start, the organizer proposes who receives the pot in which round. Every member must explicitly approve their slot.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  4
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    Pay each round with one click
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    Members receive automated Telegram reminders before each round deadline. Paying takes one tap with FaceID or fingerprint in the WebAuth app.
                  </p>
                </div>
              </div>

              <div className="card" style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  5
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "4px" }}>
                    Automatic payouts & returned deposits
                  </h3>
                  <p className="text-body" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                    The pot is sent as soon as everyone has paid, or automatically at the round deadline to that round&apos;s recipient. When the final round ends, every member&apos;s security deposit is unlocked and returned.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: Why XPR Network */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "var(--space-16)" }}>
              Why on XPR Network?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                <CheckCircle2 size={18} style={{ color: "var(--brand)", flexShrink: 0 }} />
                <p className="text-body" style={{ fontSize: "15px" }}>
                  <strong>Zero gas fees:</strong> Small regular payments don&apos;t make sense when you have to pay transaction fees. On XPR, all transfers are free.
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                <CheckCircle2 size={18} style={{ color: "var(--brand)", flexShrink: 0 }} />
                <p className="text-body" style={{ fontSize: "15px" }}>
                  <strong>Human-readable accounts:</strong> Send to <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>@alice</code> instead of long hexadecimal addresses.
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                <CheckCircle2 size={18} style={{ color: "var(--brand)", flexShrink: 0 }} />
                <p className="text-body" style={{ fontSize: "15px" }}>
                  <strong>Optional verified KYC:</strong> Know that you are pooling money with real, verified people.
                </p>
              </div>
            </div>
          </section>

          {/* Final Call to Action */}
          <div className="card" style={{ textAlign: "center", padding: "var(--space-40) var(--space-24)" }}>
            <h2 className="text-h2" style={{ fontSize: "24px", marginBottom: "8px" }}>
              Ready to start your circle?
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-24)" }}>
              Set up a group in under 2 minutes. Free, secure, and transparent.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/new" className="btn-primary btn-large">
                Create a circle
              </Link>
              <Link href="/faq" className="btn-secondary btn-large">
                Read FAQ
              </Link>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
