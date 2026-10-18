"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import ProtonWebSDK from "@proton/web-sdk";

import { RPC_ENDPOINTS } from "@/lib/rpc";

interface ProtonContextType {
  session: any;
  login: () => Promise<any>;
  logout: () => Promise<void>;
}

const ProtonContext = createContext<ProtonContextType | null>(null);

const appIdentifier = {
  appName: "artcircles",
  requestAccount: "artcircles",
};

export function ProtonProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Try to restore session on mount
    const restore = async () => {
      try {
        const res: any = await ProtonWebSDK({
          linkOptions: { endpoints: RPC_ENDPOINTS, restoreSession: true },
          transportOptions: { requestAccount: appIdentifier.requestAccount },
        });
        if (res?.session && !res?.error) {
          setSession(res.session);
        }
      } catch (e) {
        console.log("No previous session found");
      }
    };
    restore();
  }, []);

  const login = async () => {
    try {
      const res: any = await ProtonWebSDK({
        linkOptions: { endpoints: RPC_ENDPOINTS },
        transportOptions: { requestAccount: appIdentifier.requestAccount },
      });
      if (res?.session && !res?.error) {
        setSession(res.session);
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
    if (session && session.link) {
      await session.link.removeSession(appIdentifier.requestAccount, session.auth);
      setSession(null);
    }
  };

  return (
    <ProtonContext.Provider value={{ session, login, logout }}>
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
