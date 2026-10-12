import React from "react";
import Link from "next/link";
import Image from "next/image";

interface FooterProps {
  slim?: boolean;
}

export function Footer({ slim = false }: FooterProps) {
  const year = new Date().getFullYear();

  if (slim) {
    return (
      <footer style={{
        padding: "32px var(--space-20)",
        textAlign: "center",
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
        paddingBottom: "100px" // To clear mobile tab bar
      }}>
        <p className="text-caption">
          <Link href="/safety" style={{ color: "inherit" }}>Safety</Link> · 
          <a href="https://github.com/artwebin/artcircles" target="_blank" rel="noreferrer" style={{ color: "inherit", margin: "0 8px" }}>GitHub</a>
        </p>
        <p className="text-caption" style={{ marginTop: "8px", maxWidth: "600px", margin: "8px auto 0" }}>
          A community project by artwebin, a block producer on XPR Network. Not an official XPR Network product. XPR Circles has no token: any XPR Circles token or airdrop is a scam.
        </p>
      </footer>
    );
  }

  return (
    <footer style={{
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      padding: "64px 0 40px",
      marginTop: "120px"
    }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "64px" }}>
          
          <div>
            <div style={{ marginBottom: "16px" }}>
              <Image
                src="/images/xprCircle_logo.svg"
                alt="XPR Circles"
                width={140}
                height={28}
                style={{ height: "28px", width: "auto", display: "block" }}
              />
            </div>
            <p className="text-body" style={{ color: "var(--text-secondary)" }}>
              Save together with people you trust. No interest, no bank, no middleman.
            </p>
          </div>

          <div>
            <h3 className="text-label" style={{ marginBottom: "16px", color: "var(--text)" }}>Product</h3>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <li><Link href="/how-it-works" className="text-caption footer-link">How it works</Link></li>
              <li><Link href="/new" className="text-caption footer-link">Create a circle</Link></li>
              <li><Link href="/faq" className="text-caption footer-link">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-label" style={{ marginBottom: "16px", color: "var(--text)" }}>Trust</h3>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <li><Link href="/safety" className="text-caption footer-link">Safety</Link></li>
              <li><a href="https://github.com/artwebin/artcircles" target="_blank" rel="noreferrer" className="text-caption footer-link">Source code (GitHub)</a></li>
              <li><a href="https://xprnetwork.org" target="_blank" rel="noreferrer" className="text-caption footer-link">Official links</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-label" style={{ marginBottom: "16px", color: "var(--text)" }}>Community</h3>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <li><a href="https://x.com/XPRCircles" target="_blank" rel="noreferrer" className="text-caption footer-link">@XPRCircles on X</a></li>
              <li><Link href="/reminders" className="text-caption footer-link">Telegram reminders bot</Link></li>
              <li><a href="https://artwebin.com" target="_blank" rel="noreferrer" className="text-caption footer-link">artwebin</a></li>
            </ul>
          </div>

        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px", textAlign: "center" }}>
          <p className="text-caption" style={{ maxWidth: "800px", margin: "0 auto" }}>
            A community project by artwebin, a block producer on XPR Network. Not an official XPR Network product. XPR Circles has no token: any XPR Circles token or airdrop is a scam.
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .footer-link { text-decoration: none; transition: color 120ms; }
        .footer-link:hover { color: var(--text); }
      `}} />
    </footer>
  );
}
