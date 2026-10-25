"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { LinkSession } from "@proton/link";
import toast from "react-hot-toast";
import { CHAIN, CHAIN_ID } from "@/lib/config";
import { RPC_ENDPOINTS, getAccountInfo } from "@/lib/rpc";
import LoginModal, { type LoginFlow } from "@/components/auth/LoginModal";
import { walletUiOptions } from "@/components/auth/walletTheme";
import { installWalletDialogWatcher, setWalletDialogDismissListener } from "@/components/auth/walletDialog";
import { describeShape, toSignedLoginRequest, type SignedLoginRequest } from "@/lib/auth/signedResult";
import { isCancelError } from "@/lib/transact";

export type WalletSession = (Omit<LinkSession, "auth"> & {
  auth: { actor: any; permission: any };
}) | any;

interface ProtonContextType {
  /** Wallet session, set only when it belongs to the verified account. */
  session: WalletSession | null;
  /** Account verified by the server session. */
  actor: string | null;
  isConnecting: boolean;
  /** Resolves with the wallet session after a verified login, or null on cancel or failure. */
  login: () => Promise<WalletSession | null>;
  logout: () => Promise<void>;
  /** Server-verified account at render time, passed in by the layout. */
  initialActor: string | null;
}

const ProtonContext = createContext<ProtonContextType | null>(null);

const REQUEST_ACCOUNT = "artcircles";
const SDK_STORAGE_PREFIX = "proton-storage";
const CHALLENGE_REFRESH_MS = 4 * 60 * 1000;
const SUCCESS_CLOSE_DELAY_MS = 900;
const RELOAD_GUARD_KEY = "xc-reload-after-update";

type Challenge = { contract: string; action: string; verifyToken: string; fetchedAt: number };

function clearSdkStorage() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(SDK_STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable
  }
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function isChunkLoadError(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  return e?.name === "ChunkLoadError" || /Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module/i.test(e?.message ?? "");
}

function reloadForUpdate(): boolean {
  try {
    const last = parseInt(sessionStorage.getItem(RELOAD_GUARD_KEY) || "0", 10);
    if (Date.now() - last < 30000) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** Preloads the wallet SDK and installs dialog watcher */
export function preloadWallet(): Promise<unknown> {
  return Promise.all([import("@proton/web-sdk"), installWalletDialogWatcher()]).catch(() => undefined);
}

async function fetchChallenge(actor: string): Promise<Challenge> {
  const res = await fetch(`/api/auth/nonce?account=${encodeURIComponent(actor)}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not start the login.");
  return { contract: data.contract, action: data.action, verifyToken: data.verifyToken, fetchedAt: Date.now() };
}

export function ProtonProvider({
  children,
  initialActor = null,
}: {
  children: React.ReactNode;
  initialActor?: string | null;
}) {
  const [session, setSession] = useState<LinkSession | null>(null);
  const [actor, setActor] = useState<string | null>(initialActor);
  const [isConnecting, setIsConnecting] = useState(false);
  const [flow, setFlow] = useState<LoginFlow | null>(null);

  const flowIdRef = useRef(0);
  const attemptRef = useRef(0);
  const walletSessionRef = useRef<LinkSession | null>(null);
  const challengeRef = useRef<Challenge | null>(null);
  const loginResolverRef = useRef<((session: LinkSession | null) => void) | null>(null);

  // Clear legacy cookie on initial client load
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.cookie = "xpr_auth=; path=/; max-age=0; SameSite=Lax";
    }
  }, []);

  // Restore wallet session if server session exists
  useEffect(() => {
    if (!initialActor) {
      setSession(null);
      setActor(null);
      return;
    }

    let active = true;
    const restore = async () => {
      try {
        const { default: ProtonWebSDK } = await import("@proton/web-sdk");
        const res = (await ProtonWebSDK({
          linkOptions: {
            endpoints: RPC_ENDPOINTS,
            chainId: CHAIN_ID,
            restoreSession: true,
            storagePrefix: SDK_STORAGE_PREFIX,
            ...(CHAIN === "testnet" ? { testUrl: "https://webauth.com" } : {}),
          },
          transportOptions: { requestAccount: REQUEST_ACCOUNT },
        })) as { session?: LinkSession; error?: unknown } | undefined;

        if (!active) return;

        const restoredSession = res?.session as LinkSession | undefined;
        if (restoredSession && restoredSession.auth.actor.toString() === initialActor) {
          setSession(restoredSession);
          setActor(initialActor);
        } else {
          // Wallet session ended or belongs to a different account -> log out
          if (restoredSession) {
            try {
              if (typeof restoredSession.remove === "function") {
                await restoredSession.remove();
              } else if (restoredSession.link) {
                await restoredSession.link.removeSession(REQUEST_ACCOUNT, restoredSession.auth, restoredSession.chainId);
              }
            } catch (e) {
              console.warn("Could not remove mismatched session:", e);
            }
          }
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          clearSdkStorage();
          setSession(null);
          setActor(null);
          toast.error("Your wallet session ended. Please log in again.");
        }
      } catch (e) {
        console.warn("Failed to restore wallet session:", e);
        // Network failure loading SDK: keep server actor, session remains null
      }
    };

    restore();
    return () => {
      active = false;
    };
  }, [initialActor]);

  const resetFlow = useCallback(() => {
    setIsConnecting(false);
    setFlow(null);
    walletSessionRef.current = null;
    challengeRef.current = null;
    if (loginResolverRef.current) {
      loginResolverRef.current(null);
      loginResolverRef.current = null;
    }
  }, []);

  // Proton wallet dialog listener
  useEffect(() => {
    setWalletDialogDismissListener(() => {
      if (flow && flow.stage === "signing") {
        setFlow((prev) =>
          prev
            ? {
                ...prev,
                stage: "ready",
                failedStep: 3,
                error: "The signature request was closed. You can try again.",
              }
            : prev
        );
      } else if (!flow) {
        resetFlow();
      }
    });
    return () => setWalletDialogDismissListener(null);
  }, [flow, resetFlow]);

  const prepareChallenge = useCallback(async (account: string, flowId: number) => {
    try {
      const challengePromise = fetchChallenge(account);
      const profilePromise = getAccountInfo(account).catch(() => null);

      const [challenge, accountInfo] = await Promise.all([challengePromise, profilePromise]);
      if (flowId !== flowIdRef.current) return;

      challengeRef.current = challenge;
      setFlow({
        actor: account,
        profile: {
          actor: account,
          name: accountInfo?.name || account,
          avatar: accountInfo?.avatar,
          isVerified: Boolean(accountInfo?.kyc && accountInfo.kyc.length > 0),
        },
        stage: "ready",
      });
    } catch (e) {
      if (flowId !== flowIdRef.current) return;
      const isCancel = isCancelError(e);
      setFlow((prev) =>
        prev
          ? {
              ...prev,
              stage: "error",
              failedStep: 2,
              isCancel,
              error: isCancel
                ? "Signature request was not approved. You can try again."
                : "Could not prepare the login request. Please try again.",
            }
          : prev
      );
    }
  }, []);

  const login = useCallback((): Promise<LinkSession | null> => {
    setIsConnecting(true);
    const flowId = ++flowIdRef.current;

    return new Promise<LinkSession | null>(async (resolve) => {
      loginResolverRef.current = resolve;

      try {
        const [{ default: ProtonWebSDK }] = await Promise.all([
          import("@proton/web-sdk"),
          installWalletDialogWatcher(),
        ]);

        if (flowId !== flowIdRef.current) return;

        const res = (await ProtonWebSDK({
          linkOptions: {
            endpoints: RPC_ENDPOINTS,
            chainId: CHAIN_ID,
            restoreSession: false,
            storagePrefix: SDK_STORAGE_PREFIX,
            ...(CHAIN === "testnet" ? { testUrl: "https://webauth.com" } : {}),
          },
          transportOptions: {
            requestAccount: REQUEST_ACCOUNT,
            requestStatus: false,
          },
          selectorOptions: {
            enabledWalletTypes: ["proton", "webauth", "anchor"],
          },
          uiOptions: walletUiOptions,
        })) as { session?: LinkSession; error?: unknown } | undefined;

        const walletSession = res?.session;
        if (!walletSession || flowId !== flowIdRef.current) {
          if (flowId === flowIdRef.current) resetFlow();
          return;
        }

        const account = walletSession.auth.actor.toString();
        walletSessionRef.current = walletSession;
        setFlow({
          actor: account,
          profile: { actor: account, name: account },
          stage: "validating",
        });

        await prepareChallenge(account, flowId);
      } catch (e) {
        console.error("Wallet connection failed:", e);
        if (flowId !== flowIdRef.current) return;
        resetFlow();
        if (isCancelError(e)) {
          return;
        }
        if (isChunkLoadError(e)) {
          toast("Application was updated. Reloading...", { icon: "ℹ️" });
          if (reloadForUpdate()) return;
          toast.error("Application was updated. Please reload the page and try again.");
          return;
        }
        toast.error(`Could not connect the wallet: ${errorMessage(e, "unknown error")}`);
      }
    });
  }, [prepareChallenge, resetFlow]);

  const authenticate = useCallback(async () => {
    const walletSession = walletSessionRef.current;
    const current = flow;
    if (!walletSession || !current) return;

    const flowId = flowIdRef.current;
    const attempt = ++attemptRef.current;
    const currentActor = current.actor;
    const isCurrent = () => flowId === flowIdRef.current && attempt === attemptRef.current;

    setFlow((prev) => (prev ? { ...prev, stage: "signing", error: undefined, failedStep: undefined } : prev));

    let challenge = challengeRef.current;
    try {
      if (!challenge || Date.now() - challenge.fetchedAt > CHALLENGE_REFRESH_MS) {
        challenge = await fetchChallenge(currentActor);
        challengeRef.current = challenge;
      }
    } catch (err) {
      if (!isCurrent()) return;
      const isCancel = isCancelError(err);
      setFlow((prev) =>
        prev
          ? {
              ...prev,
              stage: "error",
              failedStep: 2,
              isCancel,
              error: isCancel
                ? "Signature request was not approved. You can try again."
                : "Could not prepare the login request. Please try again.",
            }
          : prev
      );
      return;
    }

    let signed: unknown;
    try {
      signed = await walletSession.transact(
        {
          actions: [
            {
              account: challenge.contract,
              name: challenge.action,
              authorization: [walletSession.auth],
              data: { account: currentActor, verify_token: challenge.verifyToken },
            },
          ],
        },
        { broadcast: false }
      );
    } catch (e) {
      console.warn("Signature request was not completed:", e);
      try {
        (walletSession as any).link?.transport?.close?.();
        (walletSession as any).link?.transport?.ui?.close?.();
      } catch {}
      if (!isCurrent()) return;
      const isCancel = isCancelError(e);
      setFlow((prev) =>
        prev
          ? {
              ...prev,
              stage: "ready",
              failedStep: 3,
              isCancel,
              error: isCancel
                ? "Signature request was not approved. You can try again."
                : "Could not prepare the login request. Please try again.",
            }
          : prev
      );
      return;
    }

    if (!isCurrent()) return;
    challengeRef.current = null; // Challenge is consumed

    let request: SignedLoginRequest;
    try {
      request = await toSignedLoginRequest(signed);
    } catch (e) {
      console.error("Could not read the wallet response:", e, describeShape(signed));
      const isCancel = isCancelError(e);
      setFlow((prev) =>
        prev
          ? {
              ...prev,
              stage: "error",
              failedStep: 3,
              isCancel,
              error: isCancel
                ? "Signature request was not approved. You can try again."
                : "Could not prepare the login request. Please try again.",
            }
          : prev
      );
      return;
    }

    setFlow((prev) => (prev ? { ...prev, stage: "verifying" } : prev));

    try {
      const verify = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await verify.json().catch(() => ({}));
      if (!isCurrent()) return;

      if (!verify.ok) {
        setFlow((prev) =>
          prev
            ? {
                ...prev,
                stage: "error",
                failedStep: 4,
                error: data.error || "The server could not verify your wallet.",
              }
            : prev
        );
        return;
      }

      setFlow((prev) => (prev ? { ...prev, stage: "success" } : prev));
      setSession(walletSession);
      setActor(data.actor);
      toast.success(`Logged in as @${data.actor}`);

      if (loginResolverRef.current) {
        loginResolverRef.current(walletSession);
        loginResolverRef.current = null;
      }

      setTimeout(() => {
        if (flowId === flowIdRef.current) {
          setIsConnecting(false);
          setFlow(null);
          walletSessionRef.current = null;
          challengeRef.current = null;
        }
      }, SUCCESS_CLOSE_DELAY_MS);
    } catch (e) {
      console.error("Login verification failed:", e);
      if (!isCurrent()) return;
      setFlow((prev) =>
        prev
          ? {
              ...prev,
              stage: "error",
              failedStep: 4,
              error: "Could not reach the server. Please try again.",
            }
          : prev
      );
    }
  }, [flow]);

  const retry = useCallback(() => {
    if (!flow) return;
    challengeRef.current = null;
    void prepareChallenge(flow.actor, flowIdRef.current);
  }, [flow, prepareChallenge]);

  const cancelLogin = useCallback(async () => {
    if (flow?.stage === "verifying" || flow?.stage === "success") return;
    const ws = walletSessionRef.current;
    if (ws) {
      try {
        if (typeof ws.remove === "function") {
          await ws.remove();
        } else if (ws.link) {
          await ws.link.removeSession(REQUEST_ACCOUNT, ws.auth, ws.chainId);
        }
      } catch (e) {
        console.warn("Could not remove wallet session on cancel:", e);
      }
    }
    clearSdkStorage();
    resetFlow();
  }, [flow, resetFlow]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      if (session) {
        try {
          if (typeof session.remove === "function") {
            await session.remove();
          } else if (session.link) {
            await session.link.removeSession(REQUEST_ACCOUNT, session.auth, session.chainId);
          }
        } catch (e) {
          console.warn("Error removing session from link:", e);
        }
      }
      clearSdkStorage();
      setSession(null);
      setActor(null);
      toast.success("Logged out");
    }
  }, [session]);

  return (
    <ProtonContext.Provider value={{ session, actor, isConnecting, login, logout, initialActor }}>
      {children}
      {flow && (
        <LoginModal
          flow={flow}
          onAuthenticate={authenticate}
          onRetry={retry}
          onCancel={cancelLogin}
        />
      )}
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
