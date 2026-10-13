import { ImageResponse } from "next/og";
import { getReputation } from "@/lib/rpc";
import { getReputationCopy, getAvatarColor } from "@/lib/reputation";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ account: string }> }) {
  const resolvedParams = await params;
  const account = resolvedParams.account || "account";

  let reputation = { completed: 0, missed: 0, defaulted: 0 };
  try {
    reputation = await getReputation(account);
  } catch (e) {
    // fallback
  }

  const { completed: c, missed: m, defaulted: d } = reputation;
  const { state, sentence } = getReputationCopy(c, m, d);
  const avatarColor = getAvatarColor(account);

  // Colors per reputation state
  let bandBg = "#F5F6F3";
  let bandBorder = "#E1E5E0";
  let textColor = "#1B2A2F";

  if (state === "reliable") {
    bandBg = "#E4EEEA";
    bandBorder = "#CFE0D8";
    textColor = "#0A3D35";
  } else if (state === "missed") {
    bandBg = "#FFF4EA";
    bandBorder = "#F1D3B5";
    textColor = "#7A3A08";
  } else if (state === "defaulted") {
    bandBg = "#FBE9E7";
    bandBorder = "#F1C9C3";
    textColor = "#7F1D14";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F7F8F5",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header: Wordmark & Identity */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: avatarColor.bg,
                color: avatarColor.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                fontWeight: 700,
                textTransform: "lowercase",
              }}
            >
              {account[0]?.toLowerCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "48px", fontWeight: 800, color: "#101816" }}>
                {account}
              </span>
              <span style={{ fontSize: "20px", color: "#4F5E62", fontWeight: 500 }}>
                XPR Network Savings Record
              </span>
            </div>
          </div>

          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0B5A4E", letterSpacing: "-0.5px" }}>
            XPR Circles
          </div>
        </div>

        {/* Reputation Card Band */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: bandBg,
            borderRadius: "24px",
            border: `2px solid ${bandBorder}`,
            padding: "36px 40px",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "18px", fontWeight: 600, color: textColor, textTransform: "uppercase", letterSpacing: "1px" }}>
            Reputation
          </span>
          <span style={{ fontSize: "36px", fontWeight: 800, color: textColor, lineHeight: 1.2 }}>
            {sentence}
          </span>
        </div>

        {/* Three Numbers */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "#FFFFFF",
            borderRadius: "24px",
            border: "2px solid #E1E5E0",
            padding: "24px 48px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#3D4C50" }}>Circles completed</span>
            <span style={{ fontSize: "44px", fontWeight: 800, color: c > 0 ? "#0B5A4E" : "#1B2A2F" }}>{c}</span>
          </div>
          <div style={{ width: "2px", height: "80px", background: "#EEF0EE" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#3D4C50" }}>Missed payments</span>
            <span style={{ fontSize: "44px", fontWeight: 800, color: m > 0 ? "#B45309" : "#1B2A2F" }}>{m}</span>
          </div>
          <div style={{ width: "2px", height: "80px", background: "#EEF0EE" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#3D4C50" }}>Defaults</span>
            <span style={{ fontSize: "44px", fontWeight: 800, color: d > 0 ? "#A3261B" : "#1B2A2F" }}>{d}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
