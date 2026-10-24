"use client";

import React, { useState, useEffect } from "react";
import { formatDeadline } from "@/lib/schedule";

interface ClientDeadlineProps {
  deadlineSec: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders an on-chain deadline in the user's local browser timezone.
 * On initial render (SSR and hydration), displays only the date (e.g. "Sun 25 Oct")
 * to guarantee that server and client render identically without hydration mismatch.
 * Once mounted in the browser, displays the exact local time (e.g. "Sun 25 Oct at 07:29").
 */
export function ClientDeadline({
  deadlineSec,
  prefix = "",
  suffix = "",
  className,
  style,
}: ClientDeadlineProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const date = new Date(deadlineSec * 1000);
  const formatted = formatDeadline(date, mounted);

  return (
    <span className={className} style={style} suppressHydrationWarning>
      {prefix}{formatted}{suffix}
    </span>
  );
}

export default ClientDeadline;
