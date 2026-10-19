"use client";

import React, { useState, useEffect, useRef } from "react";
import { useProton } from "./ProtonProvider";
import { getXusdcBalance, clearRpcCache } from "@/lib/rpc";
import { formatContractError } from "@/lib/errors";
import { runTransaction, isBrowserWebAuth } from "@/lib/transact";
import { EXPLORER_URL } from "@/lib/config";
import { ExternalLink, ShieldCheck, AlertCircle, HelpCircle } from "lucide-react";

export interface ConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sentence: string;
  to?: string;
  amountStr?: string;
  rawAmount?: number;
  memo?: string;
  account: string;
  actions: any[];
  successSentence: string;
  circleId?: string | number;
  pollCondition?: () => Promise<boolean>;
  onSuccess: () => void;
}

export function ConfirmationSheet({
  isOpen,
  onClose,
  title,
  sentence,
  to = "artcircles",
  amountStr,
  rawAmount = 0,
  memo = "",
  account,
  actions,
  successSentence,
  circleId,
  pollCondition,
  onSuccess,
}: ConfirmationSheetProps) {
  const { session } = useProton();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [status, setStatus] = useState<"confirm" | "wallet" | "checking" | "pending" | "success" | "unconfirmed">("confirm");
  const [cancelledInWallet, setCancelledInWallet] = useState(false);
  const [showPopupNotice, setShowPopupNotice] = useState(false);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [error, setError] = useState<{ message: string; rawDetails?: string } | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const attemptRef = useRef(0);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isBrowser = isBrowserWebAuth(session);

  // Load balance when opened
  useEffect(() => {
    if (isOpen && account && rawAmount > 0) {
      setLoadingBalance(true);
      getXusdcBalance(account).then((bal) => {
        setBalance(bal);
        setLoadingBalance(false);
      }).catch(() => setLoadingBalance(false));
    } else {
      setBalance(null);
    }
  }, [isOpen, account, rawAmount]);

  // Reset state when opened or closed
  useEffect(() => {
    if (isOpen) {
      setStatus("confirm");
      setCancelledInWallet(false);
      setShowPopupNotice(false);
      setRetryCooldown(0);
      setError(null);
      setTxId(null);
    } else {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    }
  }, [isOpen]);

  // Cooldown countdown for unconfirmed retry
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (status === "unconfirmed" && retryCooldown > 0) {
      timer = setInterval(() => {
        setRetryCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, retryCooldown]);

  if (!isOpen) return null;

  const hasInsufficientBalance = rawAmount > 0 && balance !== null && balance < rawAmount;
  const missingAmount = rawAmount > 0 && balance !== null ? (rawAmount - balance).toFixed(2) : "0.00";

  const handleContinueToWallet = async () => {
    if (!session) return;
    const currentAttempt = ++attemptRef.current;
    setStatus("wallet");
    setError(null);
    setCancelledInWallet(false);
    setShowPopupNotice(false);

    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => {
      if (currentAttempt === attemptRef.current) {
        setShowPopupNotice(true);
      }
    }, 4000);

    const result = await runTransaction(session, actions, pollCondition, {
      circleId,
      onStatusChange: (newStatus, details) => {
        if (currentAttempt !== attemptRef.current) return;
        if (newStatus === "checking") {
          if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
          setShowPopupNotice(false);
          setStatus("checking");
        } else if (newStatus === "pending") {
          if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
          setShowPopupNotice(false);
          setStatus("pending");
          if (details?.txId) setTxId(details.txId);
        }
      },
    });

    if (currentAttempt !== attemptRef.current) {
      return;
    }

    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    setShowPopupNotice(false);

    if (result.success) {
      clearRpcCache();
      if (result.txId) setTxId(result.txId);
      setStatus("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } else if (result.status === "cancelled") {
      setCancelledInWallet(true);
      setStatus("confirm");
    } else if (result.status === "ignored") {
      setStatus("confirm");
    } else if (result.status === "contract_error") {
      setError({ message: result.message, rawDetails: result.rawDetails });
      setStatus("confirm");
    } else if (result.status === "unconfirmed") {
      if (result.txId) setTxId(result.txId);
      setStatus("unconfirmed");
      setRetryCooldown(15);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(15, 23, 21, 0.48)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && status !== "pending" && status !== "wallet") {
          onClose();
        }
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "var(--surface)",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          margin: 0,
          padding: "var(--space-32)",
          boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.12)",
          animation: "sheetSlideUp 280ms cubic-bezier(0.2, 0, 0, 1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* State 1: Confirmation Form */}
        {(status === "confirm" || status === "wallet") && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-16)" }}>
              <h2 className="text-h2" style={{ fontSize: "22px", margin: 0 }}>
                {title}
              </h2>
              <span className="text-caption">
                Review payment
              </span>
            </div>

            {/* Neutral cancellation banner if rejected in wallet */}
            {cancelledInWallet && (
              <div
                style={{
                  background: "var(--surface-muted)",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  marginBottom: "var(--space-16)",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                }}
              >
                You cancelled in your wallet. Nothing was sent.
              </div>
            )}

            {/* Error banner if contract threw error */}
            {error && (
              <div
                style={{
                  background: "var(--danger-bg)",
                  border: "1px solid #FDA29B",
                  color: "var(--danger-text)",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--space-16)",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: "14px" }}>{error.message}</p>
                  {error.rawDetails && (
                    <p style={{ fontSize: "12px", marginTop: "2px", opacity: 0.85 }}>{error.rawDetails}</p>
                  )}
                </div>
              </div>
            )}

            {/* Plain sentence */}
            <p className="text-body" style={{ color: "var(--text)", marginBottom: "var(--space-20)", lineHeight: 1.5 }}>
              {sentence}
            </p>

            {/* Details Table */}
            <div
              style={{
                background: "var(--surface-muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                padding: "14px 18px",
                marginBottom: "var(--space-20)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--text-secondary)" }}>To</span>
                <span style={{ fontWeight: 600 }}>{to}</span>
              </div>
              {amountStr && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Amount</span>
                  <span style={{ fontWeight: 700, color: "var(--brand)" }}>{amountStr}</span>
                </div>
              )}
              {memo && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Memo</span>
                  <code style={{ background: "var(--surface)", padding: "1px 6px", borderRadius: "4px", fontSize: "13px" }}>
                    {memo}
                  </code>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Network fee</span>
                <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>None</span>
              </div>
            </div>

            {/* Insufficient balance warning */}
            {hasInsufficientBalance && (
              <div
                style={{
                  background: "var(--warning-bg)",
                  border: "1px solid #F6D799",
                  color: "var(--warning-text)",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--space-20)",
                  fontSize: "14px",
                }}
              >
                You need {missingAmount} more XUSDC. Current balance: {balance?.toFixed(2)} XUSDC.
              </div>
            )}

            {/* Safety Line */}
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "var(--space-24)" }}>
              <ShieldCheck size={18} style={{ color: "var(--brand)", flexShrink: 0, marginTop: "2px" }} />
              <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
                Your wallet will ask you to confirm this payment. XPR Circles never asks for your private keys or account permissions.
              </p>
            </div>

            {/* Pop-up blocked warning or wallet app notice */}
            {status === "wallet" && showPopupNotice && (
              isBrowser ? (
                <div
                  style={{
                    background: "var(--warning-bg)",
                    border: "1px solid #F6D799",
                    color: "var(--warning-text)",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    marginTop: "var(--space-16)",
                    fontSize: "14px",
                    lineHeight: 1.4,
                  }}
                >
                  No wallet window? Allow pop-ups for this site, then tap again.
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--surface-muted)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    marginTop: "var(--space-16)",
                    fontSize: "14px",
                    lineHeight: 1.4,
                  }}
                >
                  Check your wallet app to approve.
                </div>
              )
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "var(--space-16)" }}>
              <button
                type="button"
                className="btn-secondary btn-large"
                onClick={onClose}
                disabled={status === "wallet"}
                style={{ flex: "0 0 100px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-large"
                onClick={handleContinueToWallet}
                disabled={hasInsufficientBalance || loadingBalance || (status === "wallet" && (!isBrowser || !showPopupNotice))}
                style={{ flex: 1 }}
              >
                {status === "wallet"
                  ? isBrowser && showPopupNotice
                    ? "Tap to try again"
                    : "Waiting for wallet..."
                  : "Continue to wallet"}
              </button>
            </div>
          </div>
        )}

        {/* State 2: Checking the network */}
        {status === "checking" && (
          <div style={{ textAlign: "center", padding: "var(--space-24) 0" }} aria-live="polite">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "3px solid var(--border)",
                borderTopColor: "var(--brand)",
                margin: "0 auto var(--space-20)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <h3 className="text-h3" style={{ fontSize: "20px", marginBottom: "8px" }}>
              Checking the network…
            </h3>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-20)" }}>
              We are checking if your transaction was received on chain.
            </p>
          </div>
        )}

        {/* State 3: Pending on chain */}
        {status === "pending" && (
          <div style={{ textAlign: "center", padding: "var(--space-24) 0" }} aria-live="polite">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "3px solid var(--border)",
                borderTopColor: "var(--brand)",
                margin: "0 auto var(--space-20)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <h3 className="text-h3" style={{ fontSize: "20px", marginBottom: "8px" }}>
              Confirming on XPR Network
            </h3>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-20)" }}>
              Please wait while the transaction is confirmed on chain.
            </p>
            {txId && (
              <a
                href={`${EXPLORER_URL}/transaction/${txId}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--brand)",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                View on explorer <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        {/* State 4: Success with stroke check animation */}
        {status === "success" && (
          <div style={{ textAlign: "center", padding: "var(--space-24) 0" }} aria-live="polite">
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--brand-subtle)",
                color: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto var(--space-16)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12.5L9.5 18L20 6"
                  stroke="var(--brand)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 30,
                    strokeDashoffset: 0,
                    animation: "drawCheck 300ms cubic-bezier(0.2, 0, 0, 1) forwards",
                  }}
                />
              </svg>
            </div>
            <h3 className="text-h3" style={{ fontSize: "22px", color: "var(--brand)", marginBottom: "8px" }}>
              {successSentence}
            </h3>
            <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
              Updating circle...
            </p>
          </div>
        )}

        {/* State 5: Unconfirmed */}
        {status === "unconfirmed" && (
          <div style={{ textAlign: "center", padding: "var(--space-24) 0" }} aria-live="polite">
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--warning-bg)",
                color: "var(--warning-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto var(--space-16)",
              }}
            >
              <HelpCircle size={32} />
            </div>
            <h3 className="text-h3" style={{ fontSize: "20px", marginBottom: "8px" }}>
              Could not confirm
            </h3>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-24)", lineHeight: 1.5 }}>
              We could not confirm this. Check the circle before you try again.
            </p>
            {txId && (
              <div style={{ marginBottom: "var(--space-20)" }}>
                <a
                  href={`${EXPLORER_URL}/transaction/${txId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--brand)",
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  View on explorer <ExternalLink size={14} />
                </a>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href={circleId ? `/c/${circleId}` : "/circles"}
                className="btn-primary"
                style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
              >
                Check the circle
              </a>
              <button
                type="button"
                className="btn-secondary"
                disabled={retryCooldown > 0}
                onClick={() => setStatus("confirm")}
                style={{ width: "100%" }}
              >
                {retryCooldown > 0 ? `Wait ${retryCooldown}s to retry` : "Try again"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes sheetSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes drawCheck {
          from {
            stroke-dashoffset: 30;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
