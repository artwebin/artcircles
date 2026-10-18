"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useProton } from "@/components/ProtonProvider";
import { LogOut, ShieldCheck, Bell, LayoutGrid, PlusCircle, User, ChevronDown } from "lucide-react";
import { getAccountInfo } from "@/lib/rpc";
import { getAvatarColor, getValidAvatarUrl } from "@/lib/reputation";

export function Header() {
  const { session, login, logout } = useProton();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!session?.auth?.actor) {
      setAvatarUrl(null);
      setAvatarFailed(false);
      return;
    }
    let active = true;
    getAccountInfo(session.auth.actor)
      .then((info) => {
        if (active && info?.avatar) {
          setAvatarUrl(getValidAvatarUrl(info.avatar));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session?.auth?.actor]);

  React.useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

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
                <Link href="/new" className="text-label" style={{ textDecoration: "none", color: "var(--text)" }}>Create a circle</Link>
              </nav>
              
              <div ref={menuRef} style={{ position: "relative" }}>
                <button 
                  className="btn-ghost" 
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px" }}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {avatarUrl && !avatarFailed ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() => setAvatarFailed(true)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: session?.auth?.actor ? getAvatarColor(session.auth.actor).bg : "var(--surface-muted)",
                        color: session?.auth?.actor ? getAvatarColor(session.auth.actor).text : "var(--text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "15px",
                        fontFamily: "var(--font-heading)",
                        textTransform: "lowercase",
                        flexShrink: 0,
                      }}
                    >
                      {session?.auth?.actor ? session.auth.actor[0].toLowerCase() : ""}
                    </div>
                  )}
                  <span className="desktop-only text-label">{session.auth.actor}</span>
                  <ChevronDown size={14} className="desktop-only" style={{ color: "var(--text-secondary)", transition: "transform 150ms", transform: menuOpen ? "rotate(180deg)" : "none" }} />
                </button>

                {menuOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-overlay)",
                    minWidth: "220px",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 50,
                  }}>
                    <Link href="/circles" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <LayoutGrid size={16} /> My circles
                    </Link>
                    <Link href="/new" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <PlusCircle size={16} /> Create a circle
                    </Link>
                    <Link href={`/a/${session.auth.actor}`} className="menu-item" onClick={() => setMenuOpen(false)}>
                      <User size={16} /> My profile
                    </Link>
                    <Link href="/reminders" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <Bell size={16} /> Telegram reminders
                    </Link>
                    <Link href="/safety" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <ShieldCheck size={16} /> Safety
                    </Link>
                    <hr style={{ margin: "8px 0", borderTop: "1px solid var(--border)" }} />
                    <button 
                      className="menu-item" 
                      onClick={() => { logout(); setMenuOpen(false); }} 
                      style={{ color: "var(--danger-text)", textAlign: "left", width: "100%", background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                    >
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
