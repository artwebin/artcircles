"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, X, Check, AlertCircle, Lock, BadgeCheck } from "lucide-react";
import { getAvatarColor, getValidAvatarUrl } from "@/lib/reputation";
import styles from "./LoginModal.module.css";

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
            <span className={`${styles.stepIcon} ${styles.stepDone}`} aria-hidden="true">
                <Check size={12} strokeWidth={3} />
            </span>
        );
    }
    if (state === "error") {
        return (
            <span className={`${styles.stepIcon} ${styles.stepError}`} aria-hidden="true">
                <X size={12} strokeWidth={3} />
            </span>
        );
    }
    if (state === "active") {
        return <span className={`${styles.stepIcon} ${styles.stepActive}`} aria-hidden="true" />;
    }
    return <span className={`${styles.stepIcon} ${styles.stepPending}`} aria-hidden="true" />;
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
    if (flow.stage === "validating") primaryLabel = "Preparing request";
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
        <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && !locked && onCancel()}>
            <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="login-modal-title" aria-describedby="login-modal-desc">
                <div className={styles.header}>
                    <span className={styles.headerIcon} aria-hidden="true">
                        <ShieldCheck size={20} />
                    </span>
                    <h2 id="login-modal-title" className={styles.title}>Verify ownership</h2>
                    <button type="button" className={styles.closeBtn} onClick={onCancel} disabled={locked} aria-label="Cancel login">
                        <X size={18} />
                    </button>
                </div>

                <p id="login-modal-desc" className={styles.intro}>
                    Sign a one-time login message to prove this account is yours. It is not sent to the chain and costs nothing.
                </p>

                <div className={styles.account}>
                    <div 
                        className={styles.accountAvatar}
                        style={{ 
                            backgroundColor: validAvatar ? "transparent" : avatarColor.bg, 
                            color: avatarColor.text 
                        }}
                    >
                        {validAvatar ? (
                            <img src={validAvatar} alt={flow.actor} className={styles.accountAvatarImg} />
                        ) : (
                            flow.actor[0].toLowerCase()
                        )}
                    </div>
                    <div className={styles.accountText}>
                        <span className={styles.accountName}>
                            @{flow.actor}
                            {profile?.isVerified && (
                                <span className={styles.kycBadge} title="KYC verified">
                                    <BadgeCheck size={12} />
                                    KYC verified
                                </span>
                            )}
                        </span>
                        {profile?.name && profile.name !== flow.actor && (
                            <span className={styles.accountActor}>{profile.name}</span>
                        )}
                    </div>
                </div>

                <ol className={styles.steps} aria-live="polite">
                    {STEPS.map((label, index) => {
                        const step = index + 1;
                        const state = stepState(step, flow);
                        return (
                            <li key={label} className={`${styles.step} ${styles[`step_${state}`]}`}>
                                <StepIcon state={state} />
                                <div className={styles.stepText}>
                                    <span className={styles.stepLabel}>{label}</span>
                                    <span className={styles.stepDetail}>{stepDetail(step, state, flow)}</span>
                                </div>
                            </li>
                        );
                    })}
                </ol>

                {flow.error ? (
                    <div className={styles.errorBox} role="alert">
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span>{flow.error}</span>
                    </div>
                ) : flow.stage === "signing" ? (
                    <div className={styles.note}>
                        <Lock size={16} />
                        <span>Approve the request in your wallet.</span>
                    </div>
                ) : (
                    <div className={styles.note}>
                        <Lock size={16} />
                        <span>
                            Signing is free. The request is never sent to the blockchain and cannot move any funds.
                        </span>
                    </div>
                )}

                <button
                    ref={primaryRef}
                    type="button"
                    className={`${styles.primaryBtn} ${flow.stage === "success" ? styles.primaryDone : ""}`}
                    onClick={primaryAction}
                    disabled={busy || flow.stage === "success"}
                >
                    {busy && <span className={styles.spinner} aria-hidden="true" />}
                    {primaryLabel}
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={onCancel} disabled={locked}>
                    Cancel
                </button>
            </div>
        </div>,
        document.body
    );
}
