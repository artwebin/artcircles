"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import ProtonWebSDK from "@proton/web-sdk";
import { RPC_ENDPOINTS } from "@/lib/rpc";
import { CHAIN } from "@/lib/config";

interface ProtonContextType {
  session: any;
  login: () => Promise<any>;
  logout: () => Promise<void>;
  initialActor?: string | null;
}

const ProtonContext = createContext<ProtonContextType | null>(null);

const appIdentifier = {
  appName: "artcircles",
  requestAccount: "artcircles",
};

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN === "mainnet"
  ? "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0"
  : "71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd";

function setAuthCookie(actor: string) {
  if (typeof document !== "undefined") {
    document.cookie = `xpr_auth=${encodeURIComponent(actor)}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `xpr_auth=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function ProtonProvider({ 
  children,
  initialActor = null,
}: { 
  children: React.ReactNode;
  initialActor?: string | null;
}) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Try to restore session on mount
    const restore = async () => {
      try {
        const res: any = await ProtonWebSDK({
          linkOptions: { 
            endpoints: RPC_ENDPOINTS, 
            chainId: CHAIN_ID,
            restoreSession: true,
            ...(CHAIN === "testnet" ? { testUrl: "https://webauth.com" } : {}),
          },
          transportOptions: { requestAccount: appIdentifier.requestAccount },
        });
        if (res?.session && !res?.error) {
          setSession(res.session);
          setAuthCookie(res.session.auth.actor);
        } else {
          clearAuthCookie();
        }
      } catch (e) {
        console.log("No previous session found");
        clearAuthCookie();
      }
    };
    restore();
  }, []);

  const login = async () => {
    try {
      const res: any = await ProtonWebSDK({
        linkOptions: { 
          endpoints: RPC_ENDPOINTS,
          chainId: CHAIN_ID,
          ...(CHAIN === "testnet" ? { testUrl: "https://webauth.com" } : {}),
        },
        transportOptions: { requestAccount: appIdentifier.requestAccount },
      });
      if (res?.session && !res?.error) {
        setSession(res.session);
        setAuthCookie(res.session.auth.actor);
        return res.session;
      }
      if (res?.error) {
        console.warn("ProtonWebSDK login error:", res.error);
      }
      return null;
    } catch (e) {
      console.error("Login failed", e);
      return null;
    }
  };

  const logout = async () => {
    clearAuthCookie();
    if (session && session.link) {
      try {
        await session.link.removeSession(appIdentifier.requestAccount, session.auth);
      } catch (e) {
        console.warn("Error removing session from link:", e);
      }
    }
    setSession(null);
  };

  return (
    <ProtonContext.Provider value={{ session, login, logout, initialActor }}>
      {children}
    </ProtonContext.Provider>
  );
}

export function useProton() {
  const context = useContext(ProtonContext);
  if (!context) {
    throw new Error("useProton must be used within a ProtonProvider");
  }
  return context;
}
