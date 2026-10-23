"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useProton } from "@/components/ProtonProvider";
import { 
  LogOut, 
  ShieldCheck, 
  Bell, 
  LayoutGrid, 
  PlusCircle, 
  User, 
  ChevronDown, 
  Wallet,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { getAccountInfo } from "@/lib/rpc";
import { getAvatarColor, getValidAvatarUrl } from "@/lib/reputation";

export function Header() {
  const { session, login, logout } = useProton();
  const pathname = usePathname();
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
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
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

  // Close menu on route change
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "rgba(var(--surface-rgb, 255, 255, 255), 0.95)",
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

        {/* Right Nav & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {!session ? (
            <>
              {/* Desktop links for visitors */}
              <nav className="desktop-only" style={{ gap: "24px", alignItems: "center" }}>
                <Link href="/how-it-works" className={`nav-link ${pathname === "/how-it-works" ? "active" : ""}`}>
                  How it works
                </Link>
                <Link href="/safety" className={`nav-link ${pathname === "/safety" ? "active" : ""}`}>
                  Safety
                </Link>
                <Link href="/faq" className={`nav-link ${pathname === "/faq" ? "active" : ""}`}>
                  FAQ
                </Link>
              </nav>

              <button 
                className="header-login-btn"
                onClick={login}
              >
                <Wallet size={15} />
                <span>Log in</span>
              </button>
            </>
          ) : (
            <>
              {/* Desktop links for authenticated users: only My circles & Create a circle */}
              <nav className="desktop-only" style={{ gap: "24px", alignItems: "center" }}>
                <Link href="/circles" className={`nav-link ${pathname === "/circles" ? "active" : ""}`}>
                  My circles
                </Link>
                <Link href="/new" className={`nav-link ${pathname === "/new" ? "active" : ""}`}>
                  Create a circle
                </Link>
              </nav>

              {/* Account dropdown button */}
              <div ref={menuRef} style={{ position: "relative" }}>
                <button 
                  className="btn-ghost" 
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "4px 8px 4px 4px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
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
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: session?.auth?.actor ? getAvatarColor(session.auth.actor).bg : "var(--surface-muted)",
                        color: session?.auth?.actor ? getAvatarColor(session.auth.actor).text : "var(--text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "14px",
                        fontFamily: "var(--font-heading)",
                        textTransform: "lowercase",
                        flexShrink: 0,
                      }}
                    >
                      {session?.auth?.actor ? session.auth.actor[0].toLowerCase() : ""}
                    </div>
                  )}
                  <span className="desktop-only text-label" style={{ fontWeight: 600 }}>{session.auth.actor}</span>
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
                    minWidth: "230px",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 50,
                  }}>
                    {/* Account header */}
                    <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid var(--border)", marginBottom: "4px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                        Signed in as
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginTop: "2px" }}>
                        @{session.auth.actor}
                      </div>
                    </div>

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
                    
                    <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid var(--border)" }} />
                    
                    <Link href="/how-it-works" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <BookOpen size={16} /> How it works
                    </Link>
                    <Link href="/safety" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <ShieldCheck size={16} /> Safety
                    </Link>
                    <Link href="/faq" className="menu-item" onClick={() => setMenuOpen(false)}>
                      <HelpCircle size={16} /> FAQ
                    </Link>

                    <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid var(--border)" }} />

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
        .nav-link {
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          transition: color 140ms ease-out;
          padding: 6px 0;
          display: inline-flex;
          align-items: center;
        }
        .nav-link:hover {
          color: var(--brand);
        }
        .nav-link.active {
          color: var(--brand);
          font-weight: 600;
        }
        .header-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 36px;
          padding: 0 16px;
          background: var(--brand);
          color: var(--on-brand);
          border: none;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(11, 90, 78, 0.25);
          transition: background 140ms ease-out, transform 100ms ease-out;
        }
        .header-login-btn:hover {
          background: var(--brand-hover);
        }
        .header-login-btn:active {
          transform: scale(0.98);
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          text-decoration: none;
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius-sm);
          transition: background 120ms ease-out;
        }
        .menu-item:hover {
          background: var(--surface-muted);
        }
      `}} />
    </header>
  );
}
