"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProton } from "@/components/ProtonProvider";
import { LayoutGrid, PlusCircle, User } from "lucide-react";

export function MobileTabBar() {
  const { session } = useProton();
  const pathname = usePathname();

  // Hide on desktop, or when not logged in, or inside certain flows where tab bar should hide
  if (!session) return null;

  return (
    <nav className="mobile-tab-bar" style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: "calc(64px + env(safe-area-inset-bottom))",
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      paddingBottom: "env(safe-area-inset-bottom)",
      zIndex: 40,
    }}>
      <TabItem 
        href="/circles" 
        icon={<LayoutGrid size={24} />} 
        label="Circles" 
        active={pathname === "/circles"} 
      />
      <TabItem 
        href="/new" 
        icon={<PlusCircle size={24} />} 
        label="New" 
        active={pathname === "/new"} 
      />
      <TabItem 
        href={`/a/${session.auth.actor}`} 
        icon={<User size={24} />} 
        label="Profile" 
        active={pathname.startsWith("/a/")} 
      />

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .mobile-tab-bar { display: none !important; }
        }
      `}} />
    </nav>
  );
}

function TabItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  const color = active ? "var(--brand)" : "var(--text-secondary)";
  return (
    <Link href={href} style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      color,
      textDecoration: "none",
      flex: 1,
      height: "100%"
    }}>
      {icon}
      <span style={{ fontSize: "12px", fontWeight: 500 }}>{label}</span>
    </Link>
  );
}
