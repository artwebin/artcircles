"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import CircleRing, { HERO_EXAMPLE } from "./CircleRing";

interface StepInfo {
  num: number;
  title: string;
  desc: string;
}

const STEPS: StepInfo[] = [
  {
    num: 1,
    title: "Create the circle",
    desc: "Choose the amount, how often, and how many people. You see the pot before you share anything.",
  },
  {
    num: 2,
    title: "Share one link",
    desc: "Send it to your family or friends group. People join with one payment: a security deposit they get back at the end.",
  },
  {
    num: 3,
    title: "Agree on the order",
    desc: "The organizer proposes who takes the pot when. Everyone approves it themselves before anything starts.",
  },
  {
    num: 4,
    title: "Pay each round, take the pot once",
    desc: "Pay your share before the deadline, with a Telegram reminder the day before. When it's your turn, the pot is sent as soon as everyone has paid, or automatically at the deadline.",
  },
];

// --- Subcomponent: Step 0 Layer (Create the circle) ---
function StepZeroLayer({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const [potVal, setPotVal] = useState(reducedMotion ? "200.00" : "0.00");
  const [depositVal, setDepositVal] = useState(reducedMotion ? "25.00" : "0.00");
  const [linesVisible, setLinesVisible] = useState([reducedMotion, reducedMotion, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      setPotVal("200.00");
      setDepositVal("25.00");
      setLinesVisible([true, true, true]);
      return;
    }

    if (!active) {
      setPotVal("0.00");
      setDepositVal("0.00");
      setLinesVisible([false, false, false]);
      return;
    }

    // 1. Sequential appearance of lines with 150ms delay
    const t1 = setTimeout(() => setLinesVisible([true, false, false]), 50);
    const t2 = setTimeout(() => setLinesVisible([true, true, false]), 200);
    const t3 = setTimeout(() => setLinesVisible([true, true, true]), 350);

    // 2. Count up values in 600ms starting after lines appear (at 350ms)
    let animationFrameId: number;
    const startTime = performance.now() + 350;
    const duration = 600;

    const animateCounters = (now: number) => {
      if (now < startTime) {
        animationFrameId = requestAnimationFrame(animateCounters);
        return;
      }
      const elapsed = Math.min(now - startTime, duration);
      const progress = elapsed / duration;

      const currentPot = (200 * progress).toFixed(2);
      const currentDeposit = (25 * progress).toFixed(2);

      setPotVal(currentPot);
      setDepositVal(currentDeposit);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateCounters);
      } else {
        setPotVal("200.00");
        setDepositVal("25.00");
      }
    };

    animationFrameId = requestAnimationFrame(animateCounters);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, reducedMotion]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ background: "var(--bg)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
        <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "16px", color: "var(--text)" }}>
          Circle configuration
        </p>
        
        {/* Three sequential parameter lines */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          <span 
            style={{ 
              padding: "6px 12px", 
              background: "var(--surface)", 
              border: "1px solid var(--border)", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "13px", 
              fontWeight: 600,
              opacity: linesVisible[0] ? 1 : 0,
              transform: linesVisible[0] ? "none" : "translateY(6px)",
              transition: reducedMotion ? "none" : "opacity 200ms ease, transform 200ms ease"
            }}
          >
            8 members
          </span>
          <span 
            style={{ 
              padding: "6px 12px", 
              background: "var(--surface)", 
              border: "1px solid var(--border)", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "13px", 
              fontWeight: 600,
              opacity: linesVisible[1] ? 1 : 0,
              transform: linesVisible[1] ? "none" : "translateY(6px)",
              transition: reducedMotion ? "none" : "opacity 200ms ease, transform 200ms ease"
            }}
          >
            25.00 USDC
          </span>
          <span 
            style={{ 
              padding: "6px 12px", 
              background: "var(--surface)", 
              border: "1px solid var(--border)", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "13px", 
              fontWeight: 600,
              opacity: linesVisible[2] ? 1 : 0,
              transform: linesVisible[2] ? "none" : "translateY(6px)",
              transition: reducedMotion ? "none" : "opacity 200ms ease, transform 200ms ease"
            }}
          >
            every week
          </span>
        </div>

        {/* Dynamic calculation rows */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
          <span style={{ color: "var(--text-secondary)" }}>Pot each week</span>
          <strong style={{ fontVariantNumeric: "tabular-nums" }}>{potVal} USDC</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
          <span style={{ color: "var(--text-secondary)" }}>Security deposit</span>
          <strong style={{ fontVariantNumeric: "tabular-nums" }}>{depositVal} USDC</strong>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponent: Step 1 Layer (Share one link) ---
function StepOneLayer({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const [copied, setCopied] = useState(false);
  const [seatCount, setSeatCount] = useState(reducedMotion ? 8 : 0);
  const [barWidth, setBarWidth] = useState(reducedMotion ? 100 : 0);

  useEffect(() => {
    if (reducedMotion) {
      setCopied(false);
      setSeatCount(8);
      setBarWidth(100);
      return;
    }

    if (!active) {
      setCopied(false);
      setSeatCount(0);
      setBarWidth(0);
      return;
    }

    // 1. "Copy link" button changes to "Copied ✓" after 300ms for 1s
    const tCopyStart = setTimeout(() => setCopied(true), 300);
    const tCopyEnd = setTimeout(() => setCopied(false), 1300);

    // 2. Progress bar fills in 1.6s from 0 to 100%, text counts 0 of 8 -> 8 of 8
    let animFrame: number;
    const startTime = performance.now();
    const duration = 1600;

    const animateSeats = (now: number) => {
      const elapsed = Math.min(now - startTime, duration);
      const progress = elapsed / duration;

      const currentSeats = Math.min(8, Math.floor(progress * 8.99));
      setSeatCount(currentSeats);
      setBarWidth(progress * 100);

      if (progress < 1) {
        animFrame = requestAnimationFrame(animateSeats);
      } else {
        setSeatCount(8);
        setBarWidth(100);
      }
    };

    animFrame = requestAnimationFrame(animateSeats);

    return () => {
      clearTimeout(tCopyStart);
      clearTimeout(tCopyEnd);
      cancelAnimationFrame(animFrame);
    };
  }, [active, reducedMotion]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg)", padding: "20px" }}>
        <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>
          Invite members
        </p>
        <div style={{ display: "flex", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{ padding: "10px 14px", background: "var(--surface)", flex: 1, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>
            circles.artwebin.com/c/demo8
          </div>
          <button 
            type="button"
            style={{ 
              padding: "10px 16px", 
              background: copied ? "var(--brand-strong, #09473e)" : "var(--brand)", 
              color: "white", 
              fontSize: "13px", 
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: reducedMotion ? "none" : "background-color 200ms ease, transform 150ms ease",
              transform: copied ? "scale(0.98)" : "none"
            }}
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>

        <div style={{ height: "8px", background: "var(--surface-muted)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "8px" }}>
          <div 
            style={{ 
              width: `${barWidth}%`, 
              height: "100%", 
              background: "var(--brand)", 
              borderRadius: "var(--radius-full)",
              transition: reducedMotion ? "none" : "width 50ms linear"
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{seatCount}</span> of 8 seats taken
          </p>
          {seatCount === 8 && (
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand)" }}>All seats filled!</span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Subcomponent: Step 2 Layer (Agree on the order) ---
function StepTwoLayer({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const [approvedCount, setApprovedCount] = useState(reducedMotion ? 4 : 0);

  useEffect(() => {
    if (reducedMotion) {
      setApprovedCount(4);
      return;
    }

    if (!active) {
      setApprovedCount(0);
      return;
    }

    // Stagger 4 members with 400ms delay between approvals
    const t1 = setTimeout(() => setApprovedCount(1), 200);
    const t2 = setTimeout(() => setApprovedCount(2), 600);
    const t3 = setTimeout(() => setApprovedCount(3), 1000);
    const t4 = setTimeout(() => setApprovedCount(4), 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active, reducedMotion]);

  const members = [
    { slot: 1, name: "alice" },
    { slot: 2, name: "dan" },
    { slot: 3, name: "bob" },
    { slot: 4, name: "eve" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ padding: "16px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Payout order proposal
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {members.map((m, idx) => {
            const isApproved = approvedCount > idx;
            return (
              <div 
                key={m.name} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  fontSize: "14px", 
                  fontWeight: 600,
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)"
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ color: "var(--text-secondary)", width: "16px" }}>{m.slot}</span>
                  <span>{m.name}</span>
                </div>
                {isApproved ? (
                  <span 
                    className="status-pill status-paid" 
                    style={{ 
                      transform: "scale(0.85)", 
                      transformOrigin: "right",
                      transition: reducedMotion ? "none" : "opacity 200ms ease, transform 200ms ease"
                    }}
                  >
                    <Check size={12} strokeWidth={3} /> Approved
                  </span>
                ) : (
                  <span 
                    className="status-pill status-neutral" 
                    style={{ transform: "scale(0.85)", transformOrigin: "right" }}
                  >
                    Waiting
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ready to start banner */}
      <div 
        style={{ 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "10px", 
          borderRadius: "var(--radius-sm)", 
          background: "var(--brand-subtle)", 
          color: "var(--brand)",
          fontWeight: 700,
          fontSize: "14px",
          opacity: approvedCount >= 4 ? 1 : 0,
          transform: approvedCount >= 4 ? "none" : "translateY(8px)",
          transition: reducedMotion ? "none" : "opacity 300ms ease, transform 300ms ease"
        }}
      >
        <Check size={16} strokeWidth={2.5} /> Ready to start
      </div>
    </div>
  );
}

// --- Subcomponent: Step 3 Layer (Pay each round, take the pot once) ---
function StepThreeLayer({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "190px", height: "190px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircleRing 
          {...HERO_EXAMPLE} 
          compact 
          animate={active && !reducedMotion} 
          style={{ width: "190px", height: "190px" }} 
        />
      </div>

      <div style={{ width: "100%", background: "var(--warning-bg)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid #F2B07A" }}>
        <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--warning-text)", marginBottom: "4px" }}>
          Your payment of 25.00 USDC is due in 2 days
        </p>
        <p style={{ fontSize: "12px", color: "var(--warning-text)", marginBottom: "10px", opacity: 0.85 }}>
          Due Friday at 18:00
        </p>
        <button 
          type="button" 
          className="btn-primary btn-small" 
          style={{ width: "100%", height: "36px" }}
        >
          Pay 25.00 USDC
        </button>
      </div>
    </div>
  );
}

// Helper to render the inner content for each step index
function renderStepContent(stepIndex: number, active: boolean, reducedMotion: boolean) {
  switch (stepIndex) {
    case 0:
      return <StepZeroLayer active={active} reducedMotion={reducedMotion} />;
    case 1:
      return <StepOneLayer active={active} reducedMotion={reducedMotion} />;
    case 2:
      return <StepTwoLayer active={active} reducedMotion={reducedMotion} />;
    case 3:
      return <StepThreeLayer active={active} reducedMotion={reducedMotion} />;
    default:
      return null;
  }
}

export function HowItWorksSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobileActive, setMobileActive] = useState<Record<number, boolean>>({});

  const sectionRef = useRef<HTMLElement>(null);
  const markersRef = useRef<(HTMLDivElement | null)[]>([]);
  const mobileCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMotionChange);

    // 2. Desktop intersection observer on the 4 markers
    const desktopObservers: IntersectionObserver[] = [];
    markersRef.current.forEach((el, index) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveStep(index);
          }
        },
        { threshold: 0.5 }
      );
      obs.observe(el);
      desktopObservers.push(obs);
    });

    // 3. Track scroll progress through the section for the vertical line
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const current = -rect.top;
      const p = Math.max(0, Math.min(1, current / total));
      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // 4. Mobile intersection observer: triggers on 0.4 threshold once
    const mobileObservers: IntersectionObserver[] = [];
    mobileCardsRef.current.forEach((cardEl, index) => {
      if (!cardEl) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setMobileActive((prev) => ({ ...prev, [index]: true }));
            obs.disconnect(); // Animate once on mobile
          }
        },
        { threshold: 0.4 }
      );
      obs.observe(cardEl);
      mobileObservers.push(obs);
    });

    return () => {
      desktopObservers.forEach((o) => o.disconnect());
      mobileObservers.forEach((o) => o.disconnect());
      window.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  const scrollToStep = (index: number) => {
    const marker = markersRef.current[index];
    if (marker) {
      marker.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section ref={sectionRef} className="steps-section">
      {/* Invisible markers for desktop IntersectionObserver */}
      <div className="steps-markers-container" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              markersRef.current[i] = el;
            }}
            className="steps-marker"
          />
        ))}
      </div>

      {/* Desktop Sticky Frame */}
      <div className="steps-sticky-frame">
        <div className="container">
          <div className="steps-grid">
            
            {/* Left column */}
            <div className="steps-left-col">
              <h2 className="text-h2" style={{ marginBottom: "var(--space-24)", maxWidth: "340px" }}>
                Four steps, then it runs on its own.
              </h2>
              <p className="text-body-lg" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-32)", maxWidth: "340px" }}>
                The organizer sets it up once. After that, payouts and reminders happen by themselves.
              </p>
              <div>
                <Link href="/how-it-works" className="btn-ghost" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>
                  Read the full guide
                </Link>
              </div>

              {/* Stepper buttons with progress line */}
              <div className="steps-stepper">
                {/* Background vertical line */}
                <div className="steps-progress-track">
                  <div 
                    className="steps-progress-fill" 
                    style={{ transform: `scaleY(${progress})` }} 
                  />
                </div>

                {STEPS.map((s, idx) => {
                  const isCurrent = activeStep === idx;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      className="steps-button"
                      onClick={() => scrollToStep(idx)}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <div className="steps-badge">
                        {s.num}
                      </div>
                      <div className="steps-btn-content">
                        <h3 className="steps-btn-title">{s.title}</h3>
                        <div className="steps-desc-wrapper">
                          <div className="steps-desc-content">
                            <p className="steps-btn-desc">{s.desc}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right column: Single stage card with 4 absolute layers */}
            <div className="steps-right-col">
              <div className="card steps-stage">
                {STEPS.map((_, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <div
                      key={idx}
                      className="steps-layer"
                      data-active={isActive ? "true" : "false"}
                      aria-hidden={!isActive}
                    >
                      {renderStepContent(idx, isActive, reducedMotion)}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile container (< 1024px or prefers-reduced-motion) */}
      <div className="container" style={{ paddingTop: "var(--space-64)", paddingBottom: "var(--space-64)" }}>
        <div className="steps-mobile-container">
          <div>
            <h2 className="text-h2" style={{ marginBottom: "var(--space-20)" }}>
              Four steps, then it runs on its own.
            </h2>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-24)" }}>
              The organizer sets it up once. After that, payouts and reminders happen by themselves.
            </p>
            <Link href="/how-it-works" className="btn-ghost" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>
              Read the full guide
            </Link>
          </div>

          {STEPS.map((s, idx) => {
            const isMobileActive = reducedMotion || !!mobileActive[idx];
            return (
              <div key={s.num} className="steps-mobile-step">
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div className="steps-badge" style={{ background: "var(--brand)", color: "#ffffff", marginTop: "4px" }}>
                    {s.num}
                  </div>
                  <div>
                    <h3 className="steps-btn-title" style={{ marginBottom: "6px" }}>{s.title}</h3>
                    <p className="steps-btn-desc" style={{ margin: 0 }}>{s.desc}</p>
                  </div>
                </div>

                <div 
                  ref={(el) => {
                    mobileCardsRef.current[idx] = el;
                  }}
                  className="steps-mobile-card"
                  data-active={isMobileActive ? "true" : "false"}
                >
                  {renderStepContent(idx, isMobileActive, reducedMotion)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}

export default HowItWorksSteps;
