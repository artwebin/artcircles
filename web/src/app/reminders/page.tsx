import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { 
  Bell, 
  Send, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Coins
} from "lucide-react";

export const metadata: Metadata = {
  title: "Telegram Reminders - XPR Circles",
  description: "Set up automated payment deadline reminders and pot payout alerts with @artcircles_bot on Telegram.",
};

export default function RemindersPage() {
  return (
    <>
      <div className="container" style={{ paddingTop: "var(--space-64)", paddingBottom: "var(--space-80)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ marginBottom: "var(--space-48)" }}>
            <span className="text-label" style={{ color: "var(--brand)", letterSpacing: "0.02em", fontWeight: 700, display: "block", marginBottom: "8px" }}>
              Automated notifications
            </span>
            <h1 className="text-h1" style={{ fontSize: "clamp(34px, 4vw, 44px)", marginBottom: "var(--space-16)" }}>
              Never miss a payment deadline.
            </h1>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)" }}>
              Connect with our official Telegram bot to get quiet, timely notifications before deadlines and the instant your pot is paid out.
            </p>
          </div>

          {/* Quick Setup Card */}
          <div className="card" style={{ padding: "var(--space-32)", marginBottom: "var(--space-48)", background: "var(--surface)", border: "1px solid var(--border-strong)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-20)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={20} />
              </div>
              <h2 className="text-h2" style={{ fontSize: "20px", margin: 0 }}>
                Set up in 30 seconds
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "var(--space-24)" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
                  1
                </div>
                <p className="text-body" style={{ fontSize: "15px" }}>
                  Open the bot in Telegram: <a href="https://t.me/artcircles_bot" target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "var(--brand)", textDecoration: "underline" }}>@artcircles_bot</a>
                </p>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
                  2
                </div>
                <p className="text-body" style={{ fontSize: "15px" }}>
                  Send the message: <code style={{ background: "var(--surface-muted)", padding: "2px 8px", borderRadius: "6px", fontWeight: 600, color: "var(--text)" }}>/watch youraccount</code> (for example: <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>/watch alice</code>).
                </p>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--brand-subtle)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
                  ✓
                </div>
                <p className="text-body" style={{ fontSize: "15px" }}>
                  You are all set! The bot will now monitor all circles your account belongs to and alert you ahead of deadlines.
                </p>
              </div>
            </div>

            <a 
              href="https://t.me/artcircles_bot" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-primary btn-large"
              style={{ width: "100%", gap: "8px" }}
            >
              <Send size={18} /> Open @artcircles_bot on Telegram
            </a>
          </div>

          {/* Section: What alerts do you receive? */}
          <section style={{ marginBottom: "var(--space-48)" }}>
            <h2 className="text-h2" style={{ fontSize: "22px", marginBottom: "var(--space-20)" }}>
              Alerts sent by @artcircles_bot
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-24)" }}>
              The bot mirrors exact on-chain events from the smart contract so members and organizers always stay in sync:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {/* 1. due24 */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0, marginTop: "2px" }}>
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    24 hours before deadline
                  </h3>
                  <p className="text-caption">
                    Shows the round number, exact amount due, and direct payment memo. If it is your turn to take the pot, reminds you to pay your share so you can receive the full pot.
                  </p>
                </div>
              </div>

              {/* 2. due2 */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start", border: "1px solid #F6D799", background: "var(--surface)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--warning-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--warning-text)", flexShrink: 0, marginTop: "2px" }}>
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px", color: "var(--warning-text)" }}>
                    2 hours before deadline (if unpaid)
                  </h3>
                  <p className="text-caption">
                    Final urgent reminder sent 2 hours before the round ends with the exact payment memo, before your security deposit is automatically tapped to cover the round.
                  </p>
                </div>
              </div>

              {/* 3. approve */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0, marginTop: "2px" }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    Payout order proposed
                  </h3>
                  <p className="text-caption">
                    Sent when the organizer sets the payout order. Shows your assigned position (e.g. number 3 of 5) and asks you to review and approve it.
                  </p>
                </div>
              </div>

              {/* 4. started */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0, marginTop: "2px" }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    Circle started
                  </h3>
                  <p className="text-caption">
                    Confirms that all members approved the payout order, circle is now active, your assigned slot number, and the exact round 1 deadline in your local timezone.
                  </p>
                </div>
              </div>

              {/* 5. received */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--pot-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pot-text)", flexShrink: 0, marginTop: "2px" }}>
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    Pot payout received
                  </h3>
                  <p className="text-caption">
                    Sent the moment the smart contract executes your round payout and delivers the pooled pot directly to your account.
                  </p>
                </div>
              </div>

              {/* 6. deposit */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", flexShrink: 0, marginTop: "2px" }}>
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    Missed payment covered from deposit
                  </h3>
                  <p className="text-caption">
                    Alerts you if a payment was missed and covered by your deposit, along with instructions to refill it with memo <code style={{ background: "var(--surface-muted)", padding: "2px 4px", borderRadius: "4px" }}>topup:id</code> to stay protected.
                  </p>
                </div>
              </div>

              {/* 7. default */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", flexShrink: 0, marginTop: "2px" }}>
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    Default recorded (no deposit left)
                  </h3>
                  <p className="text-caption">
                    Notice that a payment was missed with no remaining deposit, recorded as an on-chain default and counted as debt to other members.
                  </p>
                </div>
              </div>

              {/* 8. completed */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0, marginTop: "2px" }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    Circle completed
                  </h3>
                  <p className="text-caption">
                    All rounds finished smoothly. Confirms that your initial security deposit has been refunded back to your account.
                  </p>
                </div>
              </div>

              {/* 9. full (organizer) */}
              <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0, marginTop: "2px" }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-h3" style={{ fontSize: "16px", marginBottom: "2px" }}>
                    Circle full (organizer notice)
                  </h3>
                  <p className="text-caption">
                    Alerts the organizer as soon as all member seats are filled so they can propose the payout order.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Privacy Note */}
          <div className="card" style={{ background: "var(--brand-subtle)", borderColor: "var(--border)", marginBottom: "var(--space-48)" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <ShieldCheck size={22} style={{ color: "var(--brand)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h3 className="text-h3" style={{ fontSize: "16px", color: "var(--brand)", marginBottom: "4px" }}>
                  100% Read-Only & Private
                </h3>
                <p className="text-body" style={{ color: "var(--text)", fontSize: "14px" }}>
                  The Telegram bot only reads public event logs on the blockchain. It never asks for passwords, private keys, or wallet signatures. You can stop notifications anytime by sending <code style={{ background: "rgba(255,255,255,0.6)", padding: "2px 6px", borderRadius: "4px" }}>/unwatch</code>.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
