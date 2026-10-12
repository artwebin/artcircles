import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getReputation, getAccountInfo, getMyCircles } from "@/lib/rpc";
import { ProfileViewerActions } from "@/components/ProfileViewerActions";
import { Footer } from "@/components/layout/Footer";
import { 
  Check, 
  ShieldCheck, 
  Users, 
  Coins, 
  ChevronRight,
  AlertTriangle,
  MinusCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

// 6 deterministic muted avatar palettes as required by brief
const AVATAR_PALETTES = [
  { bg: "#E4EEEA", text: "#0B5A4E" }, // brand subtle
  { bg: "#FBEFD6", text: "#7A5208" }, // pot subtle
  { bg: "#E8EEF5", text: "#1E4C7A" }, // soft blue
  { bg: "#EBF2F0", text: "#17493D" }, // deep sage
  { bg: "#EEF0EE", text: "#2E3A36" }, // soft slate
  { bg: "#F8ECE7", text: "#8A3C1E" }, // warm coral
];

function getAvatarColor(account: string) {
  let hash = 0;
  for (let i = 0; i < account.length; i++) {
    hash = account.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ account: string }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  const account = resolvedParams.account;

  if (!/^[a-z1-5.]{1,12}$/.test(account)) {
    return { title: "Account not found", robots: { index: false } };
  }

  const reputation = await getReputation(account);

  return {
    title: `@${account} - XPR Circles`,
    description: `Reputation and savings circles for @${account} on XPR Network: ${reputation.completed} completed, ${reputation.missed} missed.`,
    robots: { index: false },
  };
}

export default async function AccountPage({ 
  params 
}: { 
  params: Promise<{ account: string }> 
}) {
  const resolvedParams = await params;
  const account = resolvedParams.account;

  // Validate account name format according to XPR / Antelope rules
  if (!/^[a-z1-5.]{1,12}$/.test(account)) {
    notFound();
  }

  const [reputation, userInfo, circles] = await Promise.all([
    getReputation(account),
    getAccountInfo(account),
    getMyCircles(account),
  ]);

  const avatarColor = getAvatarColor(account);
  const isKycVerified = userInfo?.verified === 1 || (userInfo?.kyc && userInfo.kyc.length > 0);

  // Group circles
  const currentCircles = circles.filter((c: any) => c.state === 0 || c.state === 1);
  const pastCircles = circles.filter((c: any) => c.state === 2 || c.state === 3);

  return (
    <>
      <div className="container-app" style={{ paddingTop: "var(--space-40)", paddingBottom: "var(--space-80)", maxWidth: "800px" }}>
        
        {/* Profile Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-20)", marginBottom: "var(--space-32)" }}>
          {/* 64px Avatar */}
          <div 
            style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "50%", 
              background: avatarColor.bg, 
              color: avatarColor.text, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontFamily: "var(--font-bricolage), sans-serif",
              fontSize: "28px", 
              fontWeight: 800,
              flexShrink: 0,
              textTransform: "uppercase"
            }}
          >
            {account[0]}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h1 className="text-h1" style={{ fontSize: "32px" }}>{account}</h1>
              {isKycVerified ? (
                <span className="status-pill status-paid" style={{ gap: "4px" }}>
                  <Check size={14} /> KYC Verified
                </span>
              ) : (
                <span className="status-pill status-neutral">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-caption">
              XPR Network Account
            </p>
          </div>
        </div>

        {/* Reputation Card */}
        <div className="card" style={{ padding: "var(--space-24)", marginBottom: "var(--space-40)" }}>
          <h2 className="text-h3" style={{ fontSize: "18px", marginBottom: "var(--space-20)" }}>
            Reputation
          </h2>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
            gap: "var(--space-20)" 
          }}>
            {/* Stat 1: Completed */}
            <div style={{ 
              background: "var(--surface-muted)", 
              borderRadius: "var(--radius-md)", 
              padding: "16px",
              border: "1px solid var(--border)"
            }}>
              <span className="text-caption" style={{ display: "block", marginBottom: "4px" }}>
                Circles completed
              </span>
              <div className="text-amount" style={{ fontSize: "32px", color: "var(--brand)", marginBottom: "4px" }}>
                {reputation.completed}
              </div>
              <p className="text-caption" style={{ fontSize: "12px" }}>
                Finished all rounds smoothly
              </p>
            </div>

            {/* Stat 2: Missed */}
            <div style={{ 
              background: "var(--surface-muted)", 
              borderRadius: "var(--radius-md)", 
              padding: "16px",
              border: "1px solid var(--border)"
            }}>
              <span className="text-caption" style={{ display: "block", marginBottom: "4px" }}>
                Payments missed
              </span>
              <div className="text-amount" style={{ fontSize: "32px", color: reputation.missed > 0 ? "var(--warning-text)" : "var(--text)", marginBottom: "4px" }}>
                {reputation.missed}
              </div>
              <p className="text-caption" style={{ fontSize: "12px" }}>
                Covered by security deposit
              </p>
            </div>

            {/* Stat 3: Defaulted (Shown calmly in neutral tone, never red) */}
            <div style={{ 
              background: "var(--surface-muted)", 
              borderRadius: "var(--radius-md)", 
              padding: "16px",
              border: "1px solid var(--border)"
            }}>
              <span className="text-caption" style={{ display: "block", marginBottom: "4px" }}>
                Defaults
              </span>
              <div className="text-amount" style={{ fontSize: "32px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                {reputation.defaulted}
              </div>
              <p className="text-caption" style={{ fontSize: "12px" }}>
                Unpaid after deposit ran out
              </p>
            </div>
          </div>
        </div>

        {/* Current Circles Section */}
        <div style={{ marginBottom: "var(--space-40)" }}>
          <h2 className="text-h2" style={{ fontSize: "22px", marginBottom: "var(--space-16)" }}>
            Current circles ({currentCircles.length})
          </h2>

          {currentCircles.length === 0 ? (
            <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
              Not currently active in any savings circles.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {currentCircles.map((c: any) => {
                const parsedAmount = parseFloat(c.amount).toFixed(2);
                const isOrg = c.organizer === account;

                return (
                  <Link 
                    key={c.id} 
                    href={`/c/${c.id}`} 
                    className="card"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "16px 20px",
                      textDecoration: "none",
                      transition: "border-color 120ms ease"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>{c.name}</span>
                        {c.state === 1 ? (
                          <span className="status-pill status-paid" style={{ height: "22px", fontSize: "11px" }}>Active</span>
                        ) : (
                          <span className="status-pill status-neutral" style={{ height: "22px", fontSize: "11px" }}>● Waiting for members</span>
                        )}
                        {isOrg && (
                          <span className="text-caption" style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 600 }}>
                            (organizer)
                          </span>
                        )}
                      </div>
                      <p className="text-caption">
                        {parsedAmount} USDC, {c.maxMembers} members {c.state === 1 && `(Round ${c.round} of ${c.maxMembers})`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Circles Section */}
        <div style={{ marginBottom: "var(--space-40)" }}>
          <h2 className="text-h2" style={{ fontSize: "22px", marginBottom: "var(--space-16)" }}>
            Past circles ({pastCircles.length})
          </h2>

          {pastCircles.length === 0 ? (
            <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
              No completed circles yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pastCircles.map((c: any) => (
                <Link 
                  key={c.id} 
                  href={`/c/${c.id}`} 
                  className="card"
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    padding: "16px 20px",
                    textDecoration: "none",
                    opacity: 0.85
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>{c.name}</span>
                      <span className="status-pill status-neutral" style={{ height: "22px", fontSize: "11px" }}>
                        {c.state === 2 ? "Completed" : "Cancelled"}
                      </span>
                    </div>
                    <p className="text-caption">
                      {c.maxMembers} rounds completed
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Viewer's Own Profile Actions (Telegram reminders & Logout) */}
        <ProfileViewerActions account={account} />

      </div>

      <Footer slim />
    </>
  );
}
