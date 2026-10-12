import React from "react";
import Link from "next/link";

export function TestnetBanner() {
  return (
    <div 
      style={{ 
        height: "36px", 
        background: "var(--warning-bg)", 
        color: "var(--warning-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        position: "relative",
        zIndex: 50
      }}
      className="text-caption"
    >
      Testnet: no real money is used.&nbsp;<Link href="/safety" style={{ color: "var(--warning-text)", textDecoration: "underline" }}>Learn more</Link>
    </div>
  );
}
