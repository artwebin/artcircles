"use client";

import React, { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface InviteCardProps {
  circleId: string;
  circleName: string;
  seatsRemaining: number;
}

export function InviteCard({ circleId, circleName, seatsRemaining }: InviteCardProps) {
  const [copied, setCopied] = useState(false);

  const getInviteUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/c/${circleId}`;
    }
    return `https://circles.artwebin.com/c/${circleId}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl());
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${circleName} - XPR Circles`,
          text: `Join my savings circle "${circleName}" on XPR Network!`,
          url: getInviteUrl(),
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="card" style={{ background: "var(--surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
        <h3 className="text-h3">Invite members</h3>
        <span className="status-pill status-neutral">
          {seatsRemaining} {seatsRemaining === 1 ? "seat" : "seats"} left
        </span>
      </div>
      <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
        Share this link with family or friends to fill the circle seats.
      </p>

      {/* Copy Field */}
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          background: "var(--surface-muted)", 
          borderRadius: "var(--radius-md)", 
          padding: "6px 8px 6px 14px",
          border: "1px solid var(--border)",
          marginBottom: "12px",
          gap: "8px"
        }}
      >
        <span 
          style={{ 
            flex: 1, 
            fontFamily: "monospace", 
            fontSize: "13px", 
            color: "var(--text)", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap" 
          }}
        >
          {typeof window !== "undefined" ? getInviteUrl() : `/c/${circleId}`}
        </span>
        <button
          type="button"
          className="btn-secondary btn-small"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy invite link"}
          title={copied ? "Copied" : "Copy invite link"}
          style={{ 
            width: "36px", 
            height: "36px", 
            padding: 0, 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center", 
            flexShrink: 0 
          }}
        >
          {copied ? <Check size={16} style={{ color: "var(--brand)" }} /> : <Copy size={16} />}
        </button>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={handleShare}
        style={{ width: "100%" }}
      >
        <Share2 size={16} /> Share invite link
      </button>
    </div>
  );
}
