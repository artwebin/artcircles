"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useProton } from "@/components/ProtonProvider";
import { Menu, LogOut, ShieldCheck, Bell } from "lucide-react";

export function Header() {
  const { session, login, logout } = useProton();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "rgba(var(--surface-rgb, 255, 255, 255), 0.92)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid var(--border)",
      height: "var(--header-height, 64px)",
    }}>
      <div className="container" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Left: Wordmark */}
        <Link href={session ? "/circles" : "/"} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/images/xprCircle_logo.svg"
            alt="XPR Circles"
            width={140}
            height={28}
            priority
            style={{ height: "28px", width: "auto", display: "block" }}
          />
        </Link>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {!session ? (
            <>
              {/* Desktop links */}
              <nav className="desktop-only" style={{ gap: "24px" }}>
                <Link href="/how-it-works" className="text-label" style={{ textDecoration: "none", color: "var(--text)" }}>How it works</Link>
                <Link href="/safety" className="text-label" style={{ textDecoration: "none", color: "var(--text)" }}>Safety</Link>
                <Link href="/faq" className="text-label" style={{ textDecoration: "none", color: "var(--text)" }}>FAQ</Link>
              </nav>
              <button className="btn-secondary btn-small" onClick={login}>Log in</button>
            </>
          ) : (
            <>
              <nav className="desktop-only" style={{ gap: "24px", alignItems: "center" }}>
                <Link href="/circles" className="text-label" style={{ textDecoration: "none", color: "var(--text)" }}>My circles</Link>
                <Link href="/new" className="text-label" style={{ textDecoration: "none", color: "var(--text)" }}>New circle</Link>
              </nav>
              
              <div style={{ position: "relative" }}>
                <button 
                  className="btn-ghost" 
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px" }}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {session.auth.actor[0].toUpperCase()}
                  </div>
                  <span className="desktop-only text-label">{session.auth.actor}</span>
                </button>

                {menuOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-overlay)",
                    minWidth: "200px",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    <Link href={`/a/${session.auth.actor}`} className="menu-item" onClick={() => setMenuOpen(false)}>
                      My profile
                    </Link>
                    <Link href="/reminders" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <Bell size={16} /> Telegram reminders
                    </Link>
                    <Link href="/safety" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <ShieldCheck size={16} /> Safety
                    </Link>
                    <hr style={{ margin: "8px 0", borderTop: "1px solid var(--border)" }} />
                    <button className="menu-item" onClick={() => { logout(); setMenuOpen(false); }} style={{ color: "var(--danger-text)", textAlign: "left" }}>
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: flex; }
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          text-decoration: none;
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius-sm);
        }
        .menu-item:hover {
          background: var(--surface-muted);
        }
      `}} />
    </header>
  );
}
