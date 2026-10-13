"use client";

import React from "react";
import { CircleDashed, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { 
  ReputationState, 
  ReputationData, 
  getReputationCopy 
} from "@/lib/reputation";

export type { ReputationState, ReputationData };

const STATE_CONFIG: Record<
  ReputationState,
  {
    bandBg: string;
    bandBorder: string;
    textColor: string;
    icon: React.ComponentType<{ size?: number; color?: string; "aria-hidden"?: boolean }>;
    iconColor: string;
  }
> = {
  new: {
    bandBg: "#F5F6F3",
    bandBorder: "#E1E5E0",
    textColor: "#1B2A2F",
    icon: CircleDashed,
    iconColor: "#4F5E62",
  },
  reliable: {
    bandBg: "#E4EEEA",
    bandBorder: "#CFE0D8",
    textColor: "#0A3D35",
    icon: ShieldCheck,
    iconColor: "#0B5A4E",
  },
  missed: {
    bandBg: "#FFF4EA",
    bandBorder: "#F1D3B5",
    textColor: "#7A3A08",
    icon: Clock,
    iconColor: "#B45309",
  },
  defaulted: {
    bandBg: "#FBE9E7",
    bandBorder: "#F1C9C3",
    textColor: "#7F1D14",
    icon: AlertTriangle,
    iconColor: "#A3261B",
  },
};

export function ReputationCard({ reputation }: { reputation: ReputationData }) {
  const { completed: c, missed: m, defaulted: d } = reputation;
  const { state, sentence, line } = getReputationCopy(c, m, d);
  const config = STATE_CONFIG[state];
  const Icon = config.icon;

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        borderRadius: "20px",
        border: `1px solid ${config.bandBorder}`,
        background: "#FFFFFF",
      }}
    >
      {/* Top Band */}
      <div
        style={{
          background: config.bandBg,
          padding: "24px",
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            minWidth: "48px",
            borderRadius: "50%",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Icon size={24} color={config.iconColor} aria-hidden={true} />
        </div>

        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: config.textColor,
              display: "block",
              marginBottom: "4px",
            }}
          >
            Reputation
          </span>
          <h2
            className="text-h2"
            style={{
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(21px, 3vw, 26px)",
              lineHeight: 1.25,
              color: config.textColor,
              margin: "0 0 6px",
            }}
          >
            {sentence}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: config.textColor,
              opacity: 0.9,
              lineHeight: 1.45,
            }}
          >
            {line}
          </p>
        </div>
      </div>

      {/* Numbers Row */}
      <dl
        style={{
          margin: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          background: "#FFFFFF",
          borderTop: `1px solid ${config.bandBorder}`,
        }}
      >
        {/* Column 1: Completed */}
        <div
          style={{
            padding: "20px 24px",
            borderRight: "1px solid #EEF0EE",
          }}
        >
          <dt
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            Circles completed
          </dt>
          <dd
            style={{
              margin: 0,
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 800,
              fontSize: "34px",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: c > 0 ? "#0B5A4E" : "#1B2A2F",
              marginBottom: "4px",
            }}
          >
            {c}
          </dd>
          <dd
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.35,
            }}
          >
            Stayed until the end
          </dd>
        </div>

        {/* Column 2: Missed */}
        <div
          style={{
            padding: "20px 24px",
            borderRight: "1px solid #EEF0EE",
          }}
        >
          <dt
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            Missed payments
          </dt>
          <dd
            style={{
              margin: 0,
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 800,
              fontSize: "34px",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: m > 0 ? "#B45309" : "#1B2A2F",
              marginBottom: "4px",
            }}
          >
            {m}
          </dd>
          <dd
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.35,
            }}
          >
            Not paid by the deadline
          </dd>
        </div>

        {/* Column 3: Defaults */}
        <div
          style={{
            padding: "20px 24px",
          }}
        >
          <dt
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            Defaults
          </dt>
          <dd
            style={{
              margin: 0,
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 800,
              fontSize: "34px",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: d > 0 ? "#A3261B" : "#1B2A2F",
              marginBottom: "4px",
            }}
          >
            {d}
          </dd>
          <dd
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.35,
            }}
          >
            Deposit ran out, became a debt
          </dd>
        </div>
      </dl>
    </div>
  );
}
