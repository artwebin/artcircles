"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  id?: string;
  q: string;
  a: React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    q: "What is a savings circle?",
    a: (
      <p>
        A savings circle (known globally as a rotating savings and credit association, or ROSCA) is a group where everyone contributes a fixed amount every round, and each round one person takes the entire pot. By the end of the circle, everyone has paid and received the exact same total amount.
      </p>
    )
  },
  {
    q: "Are there any fees, interest, or cuts taken?",
    a: (
      <p>
        None. XPR Network has zero gas fees for transactions, and XPR Circles charges 0% protocol fees. 100% of the funds contributed by members go directly to that round&apos;s recipient. There is no interest paid or earned.
      </p>
    )
  },
  {
    q: "Why is a security deposit required to join?",
    a: (
      <p>
        In traditional offline circles, someone might receive the pot early and then stop paying subsequent rounds. To prevent this without requiring credit scores or banks, XPR Circles asks each member for a refundable security deposit (1 to 3 rounds) when joining. If a member misses a payment, the smart contract automatically deducts their round payment from their deposit.
      </p>
    )
  },
  {
    q: "When do I get my security deposit back?",
    a: (
      <p>
        Your security deposit is held safely in the smart contract and is returned to you in full as soon as the final round of the circle finishes. If you leave a circle before it starts, your deposit is refunded immediately.
      </p>
    )
  },
  {
    q: "Can the organizer steal or hold onto the money?",
    a: (
      <p>
        No. The organizer never touches anyone&apos;s cash. All deposits and round payments are sent directly to the open-source smart contract (<code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>artcircles</code>). Payouts happen automatically to the designated recipient each round without organizer intervention.
      </p>
    )
  },
  {
    q: "What happens if someone defaults?",
    a: (
      <p>
        If someone misses a payment, their security deposit covers it. If they miss multiple payments and exhaust their entire deposit, the smart contract records a permanent on-chain default on their profile. This default is publicly visible across XPR Network, protecting other circles from accepting them.
      </p>
    )
  },
  {
    q: "How do I log in? Do I need a seed phrase or password?",
    a: (
      <p>
        No seed phrase is ever required on the website. Login uses the official <strong>WebAuth</strong> wallet app with biometric authentication (FaceID or fingerprint). You sign payments by confirming on your phone.
      </p>
    )
  },
  {
    q: "What tokens are supported?",
    a: (
      <p>
        XPR Circles currently runs with <strong>XUSDC</strong> on XPR Network. XUSDC is backed 1:1 by USDC.
      </p>
    )
  },
  {
    q: "What is KYC verification?",
    a: (
      <p>
        XPR Network supports native decentralized identity. When creating a circle, an organizer can optionally toggle &quot;Require KYC verification&quot;, which allows only members who have verified their real identity in the WebAuth app to join.
      </p>
    )
  },
  {
    id: "reputation",
    q: "How is reputation counted?",
    a: (
      <p>
        When a circle ends, the contract records for every member whether they stayed until the end, how many payments they missed, and whether their deposit ran out. The profile shows those numbers as they are on chain. Nobody, including us, can edit them. A circle that is still running is not counted until it ends.
      </p>
    )
  },
  {
    q: "How do I get payment reminders?",
    a: (
      <p>
        You can connect with the official Telegram bot (<a href="https://t.me/artcircles_bot" target="_blank" rel="noreferrer" style={{ color: "var(--brand)", textDecoration: "underline" }}>@artcircles_bot</a>). It will automatically notify you 24 hours before each deadline and when it is your turn to receive the pot.
      </p>
    )
  },
  {
    q: "Why does logging in ask for a signature?",
    a: (
      <p>
        The signature proves that you control the account. It is a one-time message that is never sent to the chain and costs nothing.
      </p>
    )
  }
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#reputation") {
      const repIdx = FAQS.findIndex((f) => f.id === "reputation");
      if (repIdx !== -1) {
        setOpenIdx(repIdx);
        setTimeout(() => {
          const el = document.getElementById("reputation");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  // Structured data (JSON-LD FAQPage as specified in brief)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": typeof item.a === "string" ? item.a : item.q
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container" style={{ paddingTop: "var(--space-64)", paddingBottom: "var(--space-80)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ marginBottom: "var(--space-48)" }}>
            <span className="text-label" style={{ color: "var(--brand)", letterSpacing: "0.02em", fontWeight: 700, display: "block", marginBottom: "8px" }}>
              Questions and answers
            </span>
            <h1 className="text-h1" style={{ fontSize: "clamp(34px, 4vw, 44px)", marginBottom: "var(--space-16)" }}>
              Frequently Asked Questions
            </h1>
            <p className="text-body-lg" style={{ color: "var(--text-secondary)" }}>
              Everything you need to know about joining, organizing, and saving with XPR Circles.
            </p>
          </div>

          {/* Accordion List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "var(--space-48)" }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div 
                  key={idx} 
                  id={faq.id}
                  className="card"
                  style={{ 
                    padding: 0, 
                    overflow: "hidden", 
                    border: isOpen ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                    transition: "border-color 150ms ease"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      background: isOpen ? "var(--surface)" : "var(--surface)",
                      cursor: "pointer",
                      gap: "16px"
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "17px", color: "var(--text)" }}>
                      {faq.q}
                    </span>
                    <ChevronDown 
                      size={20} 
                      style={{ 
                        color: "var(--text-secondary)", 
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", 
                        transition: "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
                        flexShrink: 0
                      }} 
                    />
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 24px 20px", color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.6" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Card */}
          <div className="card" style={{ textAlign: "center", padding: "var(--space-40) var(--space-24)" }}>
            <h2 className="text-h2" style={{ fontSize: "22px", marginBottom: "8px" }}>
              Have more questions?
            </h2>
            <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-20)" }}>
              Read our full safety model or visit our source code on GitHub.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/safety" className="btn-primary btn-medium">
                Safety model
              </Link>
              <Link href="/how-it-works" className="btn-secondary btn-medium">
                How it works
              </Link>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
