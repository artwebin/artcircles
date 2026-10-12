"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import ProtonWebSDK from "@proton/web-sdk";

interface ProtonContextType {
  session: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const ProtonContext = createContext<ProtonContextType | null>(null);

const appIdentifier = {
  appName: "artcircles",
  requestAccount: "artcircles",
};

const endpoints = [
  "https://rpc.api.testnet.metalx.com",
  "https://proton-testnet.eoscafeblock.com",
  "https://test.proton.eosusa.io",
];

export function ProtonProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Try to restore session on mount
    const restore = async () => {
      try {
        const result = await ProtonWebSDK({
          linkOptions: { endpoints, restoreSession: true },
          transportOptions: { requestAccount: appIdentifier.requestAccount },
        });
        if (result.session) {
          setSession(result.session);
        }
      } catch (e) {
        console.log("No previous session found");
      }
    };
    restore();
  }, []);

  const login = async () => {
    try {
      const result = await ProtonWebSDK({
        linkOptions: { endpoints },
        transportOptions: { requestAccount: appIdentifier.requestAccount },
      });
      if (result.session) {
        setSession(result.session);
      }
    } catch (e) {
      console.error("Login failed", e);
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
