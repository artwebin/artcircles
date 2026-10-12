"use client";

import React from "react";
import { useProton } from "./ProtonProvider";
import Link from "next/link";
import { LogOut, Send, Bell } from "lucide-react";

interface ProfileViewerActionsProps {
  account: string;
}

export function ProfileViewerActions({ account }: ProfileViewerActionsProps) {
  const { session, logout } = useProton();

  if (!session || session.auth.actor !== account) {
    return null;
  }

  return (
    <div style={{ marginTop: "var(--space-40)", display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      {/* Telegram Reminders Card */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ 
            width: "44px", 
            height: "44px", 
            borderRadius: "50%", 
            background: "var(--brand-subtle)", 
            color: "var(--brand)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Bell size={22} />
          </div>
          <div>
            <h3 className="text-h3" style={{ fontSize: "17px", marginBottom: "2px" }}>Telegram reminders</h3>
            <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
              Get automated notifications 24h before round deadlines and when you take the pot.
            </p>
          </div>
        </div>

        <a 
          href={`https://t.me/artcircles_bot?start=${account}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-secondary"
          style={{ gap: "8px", height: "42px", padding: "0 18px" }}
        >
          <Send size={16} /> Open Telegram bot
        </a>
      </div>

      {/* Log out Row */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-12)" }}>
        <button 
          type="button" 
          onClick={logout} 
          className="btn-secondary"
          style={{ 
            gap: "8px", 
            color: "var(--text-secondary)", 
            borderColor: "var(--border)",
            height: "42px",
            padding: "0 20px"
          }}
        >
          <LogOut size={16} /> Log out from {account}
        </button>
      </div>
    </div>
  );
}
