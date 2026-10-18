"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProton } from "@/components/ProtonProvider";
import { getMemberships } from "@/lib/rpc";
import { formatContractError } from "@/lib/errors";
import { runTransaction } from "@/lib/transact";
import toast from "react-hot-toast";
import { 
  ChevronLeft, 
  Check, 
  Coins, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Lock, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function NewCirclePage() {
  const router = useRouter();
  const { session, login } = useProton();

  // Wizard step: 1, 2, or 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("25");
  const [periodSec, setPeriodSec] = useState<number>(604800); // Weekly by default
  const [maxMembers, setMaxMembers] = useState<number>(8);
  const [depositRounds, setDepositRounds] = useState<number>(1);
  const [requireKyc, setRequireKyc] = useState<boolean>(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [checkingNetwork, setCheckingNetwork] = useState(false);
  const [showPopupNotice, setShowPopupNotice] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const popupTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (unconfirmed && retryCooldown > 0) {
      timer = setInterval(() => {
        setRetryCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [unconfirmed, retryCooldown]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Calculations
  const parsedAmount = Math.max(0, parseFloat(amount || "0") || 0);
  const pot = (parsedAmount * maxMembers).toFixed(2);
  const deposit = (parsedAmount * depositRounds).toFixed(2);
  const totalVolume = (parsedAmount * maxMembers * maxMembers).toFixed(2);

  // Frequency helpers
  const getFrequencyLabel = () => {
    switch (periodSec) {
      case 86400: return "every day";
      case 604800: return "every week";
      case 1209600: return "every 2 weeks";
      case 2592000: return "every month";
      default: return "every round";
    }
  };

  const getPeriodSingular = () => {
    switch (periodSec) {
      case 86400: return "day";
      case 604800: return "week";
      case 1209600: return "2 weeks";
      case 2592000: return "month";
      default: return "round";
    }
  };

  const getDurationText = () => {
    switch (periodSec) {
      case 86400: return `${maxMembers} days`;
      case 604800: return `${maxMembers} weeks`;
      case 1209600: return `${maxMembers * 2} weeks`;
      case 2592000: return `${maxMembers} months`;
      default: return `${maxMembers} rounds`;
    }
  };

  // Step 1 Validation & Proceed
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;

    if (!name.trim()) {
      setNameError("Please enter a name for your circle.");
      hasErr = true;
    } else if (name.trim().length > 64) {
      setNameError("Circle name cannot exceed 64 characters.");
      hasErr = true;
    } else {
      setNameError(null);
    }

    if (parsedAmount <= 0) {
      setAmountError("Amount must be greater than 0 USDC.");
      hasErr = true;
    } else {
      setAmountError(null);
    }

    if (!hasErr) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step 2 Proceed to Step 3
  const handleProceedToStep3 = () => {
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 3 Submission or Login
  const handleCreateCircle = async () => {
    if (!session) {
      await login();
      return;
    }
    setLoading(true);
    setCheckingNetwork(false);
    setError(null);
    setUnconfirmed(false);
    setShowPopupNotice(false);

    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => {
      setShowPopupNotice(true);
    }, 4000);

    try {
      let prevIds = new Set<string>();
      try {
        const existing = await getMemberships(session.auth.actor);
        prevIds = new Set(existing.map((m: any) => String(m.circle)));
      } catch (e) {
        console.warn("Could not query previous memberships before creating", e);
      }

      const formattedAmount = parsedAmount.toFixed(6) + " XUSDC";

      const actions = [
        {
          account: "artcircles",
          name: "create",
          authorization: [session.auth],
          data: {
            organizer: session.auth.actor,
            name: name.trim(),
            amount: formattedAmount,
            maxMembers: maxMembers,
            periodSec: periodSec,
            requireKyc: requireKyc ? 1 : 0,
            depositRounds: depositRounds,
          },
        },
      ];

      const pollCondition = async () => {
        try {
          const fresh = await getMemberships(session.auth.actor);
          const found = fresh.find((m: any) => !prevIds.has(String(m.circle)));
          if (found) {
            return String(found.circle);
          }
        } catch {
          // ignore polling errors
        }
        return false;
      };

      const result = await runTransaction(session, actions, pollCondition, {
        onStatusChange: (status) => {
          if (status === "checking") {
            if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
            setShowPopupNotice(false);
            setCheckingNetwork(true);
          }
        },
      });

      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      setShowPopupNotice(false);
      setCheckingNetwork(false);

      if (result.success) {
        toast.success("Circle created successfully!");
        const newCircleId = result.data;
        if (newCircleId) {
          router.push(`/c/${newCircleId}`);
        } else {
          router.push("/circles");
        }
      } else if (result.status === "cancelled") {
        toast("You cancelled in your wallet. Nothing was sent.");
      } else if (result.status === "ignored") {
        // ignore
      } else if (result.status === "contract_error") {
        setError(result.message);
      } else if (result.status === "unconfirmed") {
        setUnconfirmed(true);
        setRetryCooldown(15);
      }
    } catch (err: any) {
      console.error(err);
      const formatted = formatContractError(err);
      setError(formatted.message);
    } finally {
      setLoading(false);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    }
  };

  return (
    <>
      {/* Thin Progress Bar under header */}
      <div style={{ width: "100%", height: "4px", background: "var(--border)", position: "sticky", top: 0, zIndex: 30 }}>
        <div 
          style={{ 
            height: "100%", 
            background: "var(--brand)", 
            transition: "width 280ms cubic-bezier(0.2, 0, 0, 1)",
            width: step === 1 ? "33.3%" : step === 2 ? "66.6%" : "100%" 
          }} 
        />
      </div>

      <div className="container-app" style={{ paddingTop: "var(--space-32)", paddingBottom: "120px" }}>
        {/* Step Navigation & Title */}
        <div style={{ marginBottom: "var(--space-32)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-12)" }}>
            {step === 1 ? (
              <Link href="/circles" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ChevronLeft size={16} /> Back
              </Link>
            ) : (
              <button 
                type="button" 
                onClick={() => setStep((step - 1) as 1 | 2)} 
                className="btn-ghost" 
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: 0 }}
              >
                <ChevronLeft size={16} /> Back to step {step - 1}
              </button>
            )}
            <span className="text-label" style={{ color: "var(--text-secondary)" }}>
              Step {step} of 3
            </span>
          </div>

          <h1 className="text-h1">
            {step === 1 && "The basics"}
            {step === 2 && "Members and safety"}
            {step === 3 && "Review your circle"}
          </h1>
          <p className="text-body" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
            {step === 1 && "Set the name, round amount and payment frequency."}
            {step === 2 && "Choose circle size, security deposit protection and verification."}
            {step === 3 && "Verify all details before creating the circle on XPR Network."}
          </p>
        </div>

        {/* 2-Column Wizard Layout on Desktop */}
        <div className="wizard-grid">
          
          {/* MAIN FORM COLUMN */}
          <div>
            {/* STEP 1: The Basics */}
            {step === 1 && (
              <form onSubmit={handleProceedToStep2}>
                {/* Circle Name */}
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label className="form-label" style={{ margin: 0 }}>Circle name</label>
                    <span className="text-caption">{name.length} / 64</span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    placeholder="e.g. Family savings, Summer trip, Book club"
                    maxLength={64}
                    autoFocus
                    style={{ borderColor: nameError ? "var(--danger-text)" : undefined }}
                  />
                  {nameError ? (
                    <span className="text-caption" style={{ color: "var(--danger-text)", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                      <AlertCircle size={14} /> {nameError}
                    </span>
                  ) : (
                    <span className="form-hint">Your members will see this name on the circle page.</span>
                  )}
                </div>

                {/* Amount per round */}
                <div className="form-group">
                  <label className="form-label">Amount per round</label>
                  <div className="input-suffix-wrapper">
                    <input
                      type="number"
                      className="form-input"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (amountError) setAmountError(null);
                      }}
                      min="1"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="25.00"
                      style={{ borderColor: amountError ? "var(--danger-text)" : undefined }}
                    />
                    <span className="input-suffix">USDC</span>
                  </div>
                  {amountError ? (
                    <span className="text-caption" style={{ color: "var(--danger-text)", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                      <AlertCircle size={14} /> {amountError}
                    </span>
                  ) : (
                    <span className="form-hint">Everyone pays this exact amount each round.</span>
                  )}

                  {/* Preset chips */}
                  <div className="preset-chips">
                    {[10, 25, 50, 100].map((preset) => {
                      const isActive = parsedAmount === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          className={`preset-chip ${isActive ? "active" : ""}`}
                          onClick={() => {
                            setAmount(preset.toString());
                            if (amountError) setAmountError(null);
                          }}
                        >
                          {preset} USDC
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frequency Segmented Control */}
                <div className="form-group">
                  <label className="form-label">How often</label>
                  <div className="segmented-control">
                    {[
                      ...(process.env.NEXT_PUBLIC_CHAIN !== "mainnet" ? [{ label: "Daily", sec: 86400 }] : []),
                      { label: "Weekly", sec: 604800 },
                      { label: "Every 2 weeks", sec: 1209600 },
                      { label: "Monthly", sec: 2592000 },
                    ].map((freq) => (
                      <div
                        key={freq.sec}
                        className={`segmented-option ${periodSec === freq.sec ? "active" : ""}`}
                        onClick={() => setPeriodSec(freq.sec)}
                      >
                        {freq.label}
                      </div>
                    ))}
                  </div>
                  <span className="form-hint">
                    {periodSec === 86400 && "Rounds advance every 24 hours (testnet only, best for fast testing)."}
                    {periodSec === 604800 && "Rounds advance every 7 days."}
                    {periodSec === 1209600 && "Rounds advance every 14 days, aligns with bi-weekly paychecks."}
                    {periodSec === 2592000 && "Rounds advance every 30 days, ideal for traditional monthly savings."}
                  </span>
                </div>

                <div style={{ marginTop: "var(--space-32)" }}>
                  <button type="submit" className="btn-primary btn-large" style={{ width: "100%" }}>
                    Continue to members
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Members and Safety */}
            {step === 2 && (
              <div>
                {/* Number of Members Stepper */}
                <div className="form-group">
                  <label className="form-label">Number of members</label>
                  <div className="stepper-container">
                    <button
                      type="button"
                      className="stepper-btn"
                      disabled={maxMembers <= 2}
                      onClick={() => setMaxMembers((prev) => Math.max(2, prev - 1))}
                      aria-label="Decrease members"
                    >
                      −
                    </button>
                    <div className="stepper-value">
                      <span>{maxMembers}</span>
                      <span className="text-body" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                        {maxMembers === 1 ? "member" : "members"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="stepper-btn"
                      disabled={maxMembers >= 50}
                      onClick={() => setMaxMembers((prev) => Math.min(50, prev + 1))}
                      aria-label="Increase members"
                    >
                      +
                    </button>
                  </div>
                  <span className="form-hint">
                    Runs for {maxMembers} rounds total, everyone receives the pot exactly once.
                  </span>
                </div>

                {/* Security Deposit Choice Cards */}
                <div className="form-group">
                  <label className="form-label">Security deposit</label>
                  <span className="form-hint" style={{ marginBottom: "12px", marginTop: 0 }}>
                    Held safely by the contract. Returned when the circle finishes, or if someone leaves before the start.
                  </span>

                  <div className="choice-cards-list">
                    {/* Card 1: 1 round */}
                    <div
                      className={`choice-card ${depositRounds === 1 ? "selected" : ""}`}
                      onClick={() => setDepositRounds(1)}
                    >
                      <div className="choice-radio">
                        {depositRounds === 1 && <div className="choice-radio-dot" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                            1 round (Family)
                          </span>
                          <span style={{ fontWeight: 700, color: "var(--brand)", fontSize: "15px" }}>
                            {(1 * parsedAmount).toFixed(2)} USDC
                          </span>
                        </div>
                        <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
                          Best when everyone knows and trusts each other completely.
                        </p>
                      </div>
                    </div>

                    {/* Card 2: 2 rounds */}
                    <div
                      className={`choice-card ${depositRounds === 2 ? "selected" : ""}`}
                      onClick={() => setDepositRounds(2)}
                    >
                      <div className="choice-radio">
                        {depositRounds === 2 && <div className="choice-radio-dot" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                            2 rounds (Friends)
                          </span>
                          <span style={{ fontWeight: 700, color: "var(--brand)", fontSize: "15px" }}>
                            {(2 * parsedAmount).toFixed(2)} USDC
                          </span>
                        </div>
                        <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
                          Standard protection against unexpected delays or missed payments.
                        </p>
                      </div>
                    </div>

                    {/* Card 3: 3 rounds */}
                    <div
                      className={`choice-card ${depositRounds === 3 ? "selected" : ""}`}
                      onClick={() => setDepositRounds(3)}
                    >
                      <div className="choice-radio">
                        {depositRounds === 3 && <div className="choice-radio-dot" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                            3 rounds (People you know less well)
                          </span>
                          <span style={{ fontWeight: 700, color: "var(--brand)", fontSize: "15px" }}>
                            {(3 * parsedAmount).toFixed(2)} USDC
                          </span>
                        </div>
                        <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
                          Maximum protection for broader community or association circles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KYC Switch */}
                <div className="form-group">
                  <div className="switch-card" onClick={() => setRequireKyc(!requireKyc)}>
                    <div>
                      <span style={{ fontWeight: 600, display: "block", marginBottom: "2px" }}>
                        Require KYC verification
                      </span>
                      <span className="text-caption">
                        Only accounts verified with WebAuth ID can join this circle.
                      </span>
                    </div>
                    <div className={`switch-toggle ${requireKyc ? "active" : ""}`}>
                      <div className="switch-thumb" />
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: "flex", gap: "12px", marginTop: "var(--space-32)" }}>
                  <button
                    type="button"
                    className="btn-secondary btn-large"
                    onClick={() => setStep(1)}
                    style={{ flex: "0 0 120px" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn-primary btn-large"
                    onClick={handleProceedToStep3}
                    style={{ flex: 1 }}
                  >
                    Continue to review
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Sign */}
            {step === 3 && (
              <div>
                {/* Plain Narrative Box */}
                <div 
                  style={{ 
                    background: "var(--brand-subtle)", 
                    borderRadius: "var(--radius-lg)", 
                    padding: "var(--space-24)", 
                    marginBottom: "var(--space-24)",
                    border: "1px solid var(--border)"
                  }}
                >
                  <h3 className="text-h3" style={{ color: "var(--brand)", marginBottom: "var(--space-12)" }}>
                    How this circle will work
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p className="text-body" style={{ color: "var(--text)" }}>
                      • <strong>{maxMembers} people</strong> pay <strong>{parsedAmount.toFixed(2)} USDC</strong> {getFrequencyLabel()}.
                    </p>
                    <p className="text-body" style={{ color: "var(--text)" }}>
                      • Each {getPeriodSingular()} one of them takes the pot of <strong>{pot} USDC</strong>.
                    </p>
                    <p className="text-body" style={{ color: "var(--text)" }}>
                      • It runs for <strong>{maxMembers} rounds</strong> ({getDurationText()}).
                    </p>
                    <p className="text-body" style={{ color: "var(--text)" }}>
                      • Everyone pays a <strong>{deposit} USDC</strong> security deposit to join, returned in full at the end.
                    </p>
                    <p className="text-body" style={{ color: "var(--text)" }}>
                      • {requireKyc ? "Verified KYC accounts only." : "Open to all XPR accounts."}
                    </p>
                  </div>
                </div>

                {/* Details Breakdown Card */}
                <div className="card" style={{ marginBottom: "var(--space-24)" }}>
                  <h3 className="text-h3" style={{ marginBottom: "var(--space-16)" }}>Circle summary</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="text-body" style={{ color: "var(--text-secondary)" }}>Circle name</span>
                      <span className="text-body" style={{ fontWeight: 700 }}>{name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="text-body" style={{ color: "var(--text-secondary)" }}>Organizer</span>
                      <span className="text-body" style={{ fontWeight: 700 }}>
                        {session ? `${session.auth.actor} (you)` : "You (login to sign)"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="text-body" style={{ color: "var(--text-secondary)" }}>Pot per round</span>
                      <span className="text-body" style={{ fontWeight: 700, color: "var(--brand)" }}>{pot} USDC</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="text-body" style={{ color: "var(--text-secondary)" }}>Security deposit</span>
                      <span className="text-body" style={{ fontWeight: 700 }}>{deposit} USDC</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="text-body" style={{ color: "var(--text-secondary)" }}>Total circle volume</span>
                      <span className="text-body" style={{ fontWeight: 700 }}>{totalVolume} USDC</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="text-body" style={{ color: "var(--text-secondary)" }}>Total duration</span>
                      <span className="text-body" style={{ fontWeight: 700 }}>{getDurationText()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="text-body" style={{ color: "var(--text-secondary)" }}>Who can join</span>
                      <span className="text-body" style={{ fontWeight: 700 }}>{requireKyc ? "KYC required" : "Anyone with the link"}</span>
                    </div>
                  </div>
                </div>

                {/* Organizer Note */}
                <div style={{ 
                  display: "flex", 
                  gap: "12px", 
                  padding: "16px", 
                  background: "var(--surface)", 
                  borderRadius: "var(--radius-md)", 
                  border: "1px solid var(--border)",
                  marginBottom: "var(--space-24)" 
                }}>
                  <ShieldCheck size={20} style={{ color: "var(--brand)", flexShrink: 0, marginTop: "2px" }} />
                  <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
                    The smart contract will hold all deposits and pot transfers securely. As the organizer, you will share the invite link and arrange the payout order once seats are full. You are not automatically a member; you can join your own circle after creation.
                  </p>
                </div>

                {/* Pop-up blocked warning */}
                {loading && showPopupNotice && (
                  <div
                    style={{
                      background: "var(--warning-bg)",
                      border: "1px solid #F6D799",
                      color: "var(--warning-text)",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "var(--space-20)",
                      fontSize: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    No wallet window? Allow pop-ups for this site, then tap again.
                  </div>
                )}

                {/* Unconfirmed warning */}
                {unconfirmed && (
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--warning-bg)",
                      border: "1px solid #F6D799",
                      color: "var(--warning-text)",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "var(--space-24)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                      <AlertCircle size={20} />
                      <span>We could not confirm this. Check the circle before you try again.</span>
                    </div>
                    <Link
                      href="/circles"
                      className="btn-secondary"
                      style={{ alignSelf: "flex-start", marginTop: "4px" }}
                    >
                      View my circles
                    </Link>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div style={{ 
                    padding: "16px", 
                    background: "var(--danger-bg)", 
                    color: "var(--danger-text)", 
                    borderRadius: "var(--radius-md)", 
                    border: "1px solid #FDA29B", 
                    marginBottom: "var(--space-24)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "12px", marginTop: "var(--space-32)" }}>
                  <button
                    type="button"
                    className="btn-secondary btn-large"
                    onClick={() => setStep(2)}
                    disabled={loading}
                    style={{ flex: "0 0 120px" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn-primary btn-large"
                    onClick={handleCreateCircle}
                    disabled={(loading && !showPopupNotice) || retryCooldown > 0}
                    style={{ flex: 1 }}
                  >
                    {loading
                      ? showPopupNotice
                        ? "Tap to try again"
                        : checkingNetwork
                        ? "Checking the network…"
                        : "Confirming on wallet..."
                      : !session
                      ? "Log in with WebAuth to create"
                      : retryCooldown > 0
                      ? `Wait ${retryCooldown}s to retry`
                      : "Create circle"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP SIDEBAR: Live Summary Card */}
          <div style={{ position: "sticky", top: "24px" }}>
            <div className="card" style={{ background: "var(--surface)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-16)" }}>
                <span className="text-label" style={{ color: "var(--text-secondary)" }}>
                  Live preview
                </span>
                <span className="status-pill status-neutral">
                  {maxMembers} seats
                </span>
              </div>

              {/* Pot Highlight */}
              <div style={{ 
                background: "var(--pot-subtle)", 
                border: "1px solid #F6D799", 
                borderRadius: "var(--radius-md)", 
                padding: "16px", 
                marginBottom: "var(--space-20)" 
              }}>
                <span className="text-caption" style={{ color: "var(--pot-text)", display: "block", marginBottom: "2px" }}>
                  Pot per round
                </span>
                <div className="text-amount" style={{ color: "var(--pot-text)", fontSize: "32px", lineHeight: 1.1 }}>
                  {pot} USDC
                </div>
                <span className="text-caption" style={{ color: "var(--pot-text)", marginTop: "4px", display: "block" }}>
                  Distributed to one member every {getPeriodSingular()}
                </span>
              </div>

              {/* Quick specs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-16)", marginBottom: "var(--space-16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-caption">Round payment</span>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    {parsedAmount.toFixed(2)} USDC {getFrequencyLabel()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-caption">Security deposit</span>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    {deposit} USDC
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-caption">Total duration</span>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    {getDurationText()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-caption">Who can join</span>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    {requireKyc ? "KYC required" : "Anyone with the link"}
                  </span>
                </div>
              </div>

              <p className="text-caption" style={{ color: "var(--text-secondary)" }}>
                Everyone gets their security deposit back in full when all rounds are completed.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE STICKY SUMMARY BAR */}
      <div className="wizard-mobile-summary">
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontWeight: 800, fontSize: "17px", color: "var(--brand)" }}>
              {pot} USDC
            </span>
            <span className="text-caption">pot</span>
          </div>
          <div className="text-caption" style={{ fontSize: "12px" }}>
            {maxMembers} members, {parsedAmount.toFixed(2)} USDC {getFrequencyLabel()}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="text-caption" style={{ fontSize: "12px", display: "block" }}>
            Deposit: {deposit} USDC
          </span>
          <span className="text-caption" style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 600 }}>
            {maxMembers} rounds
          </span>
        </div>
      </div>

      <Footer slim />
    </>
  );
}
