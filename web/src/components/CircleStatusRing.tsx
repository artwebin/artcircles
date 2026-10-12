"use client";

import React from "react";
import CircleRing, { RingMember } from "./CircleRing";
import { useProton } from "./ProtonProvider";

interface CircleStatusRingProps {
  members: RingMember[];
  currentRound: number;
  potAmount: string;
}

export function CircleStatusRing({
  members,
  currentRound,
  potAmount,
}: CircleStatusRingProps) {
  const { session } = useProton();
  const viewer = session?.auth?.actor;

  return (
    <div style={{ width: "100%", maxWidth: "240px", margin: "0 auto" }}>
      <CircleRing
        compact
        members={members}
        currentRound={currentRound}
        potAmount={potAmount}
        viewer={viewer}
      />
    </div>
  );
}

export default CircleStatusRing;
