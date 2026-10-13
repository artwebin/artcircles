"use client";

import React from "react";
import { RotateCw, AlertTriangle } from "lucide-react";

export function RpcErrorView() {
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = () => {
    setRetrying(true);
    window.location.reload();
  };

  return (
    <div
      className="container"
      style={{
        maxWidth: "640px",
        margin: "60px auto",
        padding: "0 20px",
      }}
    >
      <div
        className="card"
        style={{
          borderRadius: "20px",
          border: "1px solid #E1E5E0",
          padding: "40px 24px",
          textAlign: "center",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#FFF4EA",
            color: "#B45309",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "22px",
            fontWeight: 700,
            color: "#1B2A2F",
            marginBottom: "8px",
          }}
        >
          Could not reach XPR Network
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#4F5E62",
            marginBottom: "24px",
            lineHeight: 1.5,
          }}
        >
          The network endpoints did not respond in time. Please try again.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={handleRetry}
          disabled={retrying}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            padding: "0 24px",
          }}
        >
          <RotateCw size={16} className={retrying ? "spin" : ""} />
          {retrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}
