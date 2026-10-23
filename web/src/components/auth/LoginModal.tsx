"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, X, Check, AlertCircle, Lock, BadgeCheck } from "lucide-react";
import { getAvatarColor, getValidAvatarUrl } from "@/lib/reputation";

export type LoginStage = "validating" | "ready" | "signing" | "verifying" | "success" | "error";

export interface LoginFlow {
  actor: string;
  profile: { actor: string; name?: string; avatar?: string; isVerified?: boolean };
  stage: LoginStage;
  error?: string;
  /** The step that failed, shown with an error marker. */
  failedStep?: 2 | 3 | 4;
}

interface LoginModalProps {
  flow: LoginFlow;
  onAuthenticate: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

type StepState = "done" | "active" | "pending" | "error";

const STAGE_ORDER: Record<LoginStage, number> = {
  validating: 2,
  ready: 3,
  signing: 3,
  verifying: 4,
  success: 5,
  error: 0,
};

function stepState(step: number, flow: LoginFlow): StepState {
  if (flow.failedStep === step) return "error";
  if (flow.stage === "error") {
    return flow.failedStep && step < flow.failedStep ? "done" : "pending";
  }
  const current = STAGE_ORDER[flow.stage];
  if (step < current) return "done";
  if (step === current) {
    return flow.stage === "ready" ? "pending" : "active";
  }
  return "pending";
}

function stepDetail(step: number, state: StepState, flow: LoginFlow): string {
  switch (step) {
    case 1:
      return `Connected as ${flow.actor}`;
    case 2:
      if (state === "done") return "Account found on XPR Network";
      if (state === "error") return "Could not validate the account";
      return "Checking the account on XPR Network";
    case 3:
      if (state === "done") return "Signature received";
      if (state === "active") return "Approve the request in your wallet";
      if (state === "error") {
        return flow.stage === "error" ? "The signed request could not be read" : "Signature request was not approved";
      }
      return "Sign a one-time verification request";
    default:
      if (state === "done") return "You are signed in";
      if (state === "active") return "Verifying the signature";
      if (state === "error") return "The signature could not be verified";
      return "Server checks the signature against your account keys";
  }
}

const STEPS = ["Wallet connected", "Account validated", "Signature proof", "Confirm authentication"];

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span
        style={{
          position: "relative",
          zIndex: 2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          flexShrink: 0,
          background: "var(--brand)",
          color: "var(--on-brand)",
        }}
        aria-hidden="true"
      >
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }
  if (state === "error") {
    return (
      <span
        style={{
          position: "relative",
          zIndex: 2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          flexShrink: 0,
          background: "var(--danger-text, #c53030)",
          color: "#fff",
        }}
        aria-hidden="true"
      >
        <X size={13} strokeWidth={3} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        style={{
          position: "relative",
          zIndex: 2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          flexShrink: 0,
          border: "2px solid var(--border)",
          borderTopColor: "var(--brand)",
          background: "var(--surface)",
          animation: "spin 0.8s linear infinite",
        }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      style={{
        position: "relative",
        zIndex: 2,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        flexShrink: 0,
        border: "2px solid var(--border)",
        background: "var(--surface)",
      }}
      aria-hidden="true"
    />
  );
}

export default function LoginModal({ flow, onAuthenticate, onRetry, onCancel }: LoginModalProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);

  const busy = flow.stage === "validating" || flow.stage === "signing" || flow.stage === "verifying";
  const locked = flow.stage === "verifying" || flow.stage === "success";

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [locked, onCancel]);

  useEffect(() => {
    if (flow.stage === "ready" || flow.stage === "error") primaryRef.current?.focus();
  }, [flow.stage]);

  let primaryLabel = "Authenticate";
  let primaryAction = onAuthenticate;
  if (flow.stage === "validating") primaryLabel = "Preparing request…";
  if (flow.stage === "signing") primaryLabel = "Waiting for your wallet…";
  if (flow.stage === "verifying") primaryLabel = "Verifying…";
  if (flow.stage === "success") primaryLabel = "Signed in";
  if (flow.stage === "error") {
    primaryLabel = "Try again";
    primaryAction = onRetry;
  }

  const { profile } = flow;
  const validAvatar = profile?.avatar ? getValidAvatarUrl(profile.avatar) : null;
  const avatarColor = getAvatarColor(flow.actor);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15, 23, 21, 0.52)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onMouseDown={(e) => e.target === e.currentTarget && !locked && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        aria-describedby="login-modal-desc"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "440px",
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          padding: "26px",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.22)",
          animation: "popIn 0.22s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-md, 10px)",
              color: "var(--brand)",
              background: "var(--brand-subtle)",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <ShieldCheck size={20} />
          </span>
          <h2 id="login-modal-title" className="text-h3" style={{ flex: 1, margin: 0, fontSize: "20px" }}>
            Verify ownership
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={locked}
            aria-label="Cancel login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              padding: 0,
              border: "none",
              borderRadius: "var(--radius-sm, 6px)",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: locked ? "not-allowed" : "pointer",
              opacity: locked ? 0.35 : 1,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Intro */}
        <p id="login-modal-desc" className="text-body" style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
          Sign a one-time login message to prove this account is yours. It is not sent to the chain and costs nothing.
        </p>

        {/* Account card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            marginBottom: "18px",
            borderRadius: "var(--radius-md, 10px)",
            background: "var(--surface-muted)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              fontWeight: 700,
              overflow: "hidden",
              backgroundColor: validAvatar ? "transparent" : avatarColor.bg,
              color: avatarColor.text,
            }}
          >
            {validAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={validAvatar} alt={flow.actor} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              flow.actor[0].toLowerCase()
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--text)", fontSize: "15px" }}>
              @{flow.actor}
              {profile?.isVerified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "2px 7px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--brand)",
                    background: "var(--brand-subtle)",
                    border: "1px solid rgba(11, 90, 78, 0.25)",
                  }}
                  title="KYC verified"
                >
                  <BadgeCheck size={12} />
                  KYC verified
                </span>
              )}
            </span>
            {profile?.name && profile.name !== flow.actor && (
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{profile.name}</span>
            )}
          </div>
        </div>

        {/* Steps */}
        <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", margin: "0 0 18px 0", padding: 0 }} aria-live="polite">
          {STEPS.map((label, index) => {
            const step = index + 1;
            const state = stepState(step, flow);
            const isLast = index === STEPS.length - 1;
            return (
              <li key={label} style={{ position: "relative", display: "flex", gap: "12px", paddingBottom: isLast ? 0 : "16px" }}>
                {!isLast && (
                  <div className={`auth-step-connector ${state === "done" ? "done" : ""}`} />
                )}
                <StepIcon state={state} />
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: state === "pending" ? "var(--text-secondary)" : "var(--text)" }}>
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color:
                        state === "active"
                          ? "var(--brand)"
                          : state === "error"
                          ? "var(--danger-text, #c53030)"
                          : "var(--text-secondary)",
                      fontWeight: state === "active" ? 500 : 400,
                    }}
                  >
                    {stepDetail(step, state, flow)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Feedback area */}
        {flow.error ? (
          <div
            role="alert"
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              padding: "10px 14px",
              marginBottom: "18px",
              borderRadius: "var(--radius-md, 10px)",
              fontSize: "13px",
              lineHeight: 1.45,
              color: "var(--danger-text, #c53030)",
              background: "var(--danger-bg, #fff5f5)",
              border: "1px solid var(--danger-border, #feb2b2)",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{flow.error}</span>
          </div>
        ) : flow.stage === "signing" ? (
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              padding: "10px 14px",
              marginBottom: "18px",
              borderRadius: "var(--radius-md, 10px)",
              fontSize: "13px",
              lineHeight: 1.45,
              color: "var(--brand)",
              background: "var(--brand-subtle)",
              border: "1px solid rgba(11, 90, 78, 0.25)",
            }}
          >
            <Lock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontWeight: 500 }}>Approve the request in your wallet.</span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              padding: "10px 14px",
              marginBottom: "18px",
              borderRadius: "var(--radius-md, 10px)",
              fontSize: "13px",
              lineHeight: 1.45,
              color: "var(--text-secondary)",
              background: "var(--surface-muted)",
              border: "1px solid var(--border)",
            }}
          >
            <Lock size={16} style={{ flexShrink: 0, marginTop: "2px", color: "var(--brand)" }} />
            <span>Signing is free. The request is never sent to the blockchain and cannot move any funds.</span>
          </div>
        )}

        {/* Action Buttons */}
        <button
          ref={primaryRef}
          type="button"
          className="btn-primary"
          onClick={primaryAction}
          disabled={busy || flow.stage === "success"}
          style={{
            width: "100%",
            height: "46px",
            borderRadius: "var(--radius-md, 10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: busy || flow.stage === "success" ? "not-allowed" : "pointer",
            opacity: busy || flow.stage === "success" ? 0.65 : 1,
          }}
        >
          {busy && (
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite",
              }}
              aria-hidden="true"
            />
          )}
          {primaryLabel}
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={onCancel}
          disabled={locked}
          style={{
            width: "100%",
            marginTop: "8px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            cursor: locked ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
