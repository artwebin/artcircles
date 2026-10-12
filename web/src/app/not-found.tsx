import Link from "next/link";
import { ArrowLeft, Home, CircleDot } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <div 
        className="container" 
        style={{ 
          paddingTop: "var(--space-80)", 
          paddingBottom: "var(--space-80)",
          minHeight: "calc(100vh - 280px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "520px", textAlign: "center", margin: "0 auto" }}>
          <div 
            style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "50%", 
              background: "var(--surface-muted)", 
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--space-24)"
            }}
          >
            <CircleDot size={32} />
          </div>

          <span 
            className="text-label" 
            style={{ 
              color: "var(--brand)", 
              letterSpacing: "0.02em", 
              fontWeight: 700, 
              display: "block", 
              marginBottom: "8px" 
            }}
          >
            404 - Page not found
          </span>

          <h1 
            className="text-h1" 
            style={{ fontSize: "clamp(30px, 4vw, 38px)", marginBottom: "var(--space-16)" }}
          >
            This page does not exist.
          </h1>

          <p 
            className="text-body-lg" 
            style={{ color: "var(--text-secondary)", marginBottom: "var(--space-32)" }}
          >
            The circle, account, or page you were looking for could not be found or has moved.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="btn-primary btn-large" style={{ gap: "8px" }}>
              <Home size={18} /> Go to Home
            </Link>
            <Link href="/circles" className="btn-secondary btn-large" style={{ gap: "8px" }}>
              <CircleDot size={18} /> My circles
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
