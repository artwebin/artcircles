"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProton } from "@/components/ProtonProvider";
import { getCircle, getMembers } from "@/lib/rpc";
import toast from "react-hot-toast";
import { 
  ChevronLeft, 
  ArrowUp, 
  ArrowDown, 
  GripVertical, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Sparkles,
  Users
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { formatContractError } from "@/lib/errors";

export default function SetOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const circleId = resolvedParams.id;

  const { session, login } = useProton();
  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [c, m] = await Promise.all([
          getCircle(circleId),
          getMembers(circleId),
        ]);
        if (!isMounted) return;
        setCircle(c);
        setMembers(m);

        if (m && m.length > 0) {
          // If order was already set before (some slot != 0), preserve existing order
          const hasExistingSlots = m.some((member: any) => member.slot !== 0);
          if (hasExistingSlots) {
            const sorted = [...m].sort((a: any, b: any) => {
              if (a.slot === 0) return 1;
              if (b.slot === 0) return -1;
              return a.slot - b.slot;
            });
            setOrder(sorted.map((member: any) => member.account));
          } else {
            setOrder(m.map((member: any) => member.account));
          }
        }
      } catch (err) {
        console.error("Failed to load circle order data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [circleId]);

  if (loading) {
    return (
      <div className="container-app" style={{ paddingTop: "var(--space-64)", maxWidth: "560px", textAlign: "center" }}>
        <p className="text-caption">Loading payout order...</p>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="container-app" style={{ paddingTop: "var(--space-64)", maxWidth: "560px", textAlign: "center" }}>
        <h1 className="text-h2" style={{ marginBottom: "16px" }}>Circle not found</h1>
        <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          There is no circle #{circleId}.
        </p>
        <Link href="/circles" className="btn-primary">
          Back to My circles
        </Link>
      </div>
    );
  }

  const isOrganizer = session && session.auth.actor === circle.organizer;
  const parsedAmount = parseFloat(circle.amount || "0");
  const pot = (parsedAmount * circle.maxMembers).toFixed(2);

  // Helper actions
  const handleOrganizerLast = () => {
    if (!circle.organizer) return;
    const withoutOrg = order.filter((acc) => acc !== circle.organizer);
    if (order.includes(circle.organizer)) {
      setOrder([...withoutOrg, circle.organizer]);
      toast.success("Organizer moved to last position");
    }
  };

  const handleReverse = () => {
    setOrder([...order].reverse());
    toast.success("Payout order reversed");
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index >= order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setOrder(newOrder);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newOrder = [...order];
    const item = newOrder.splice(draggedIdx, 1)[0];
    newOrder.splice(index, 0, item);
    setDraggedIdx(index);
    setOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Save order to chain
  const handleSaveOrder = async () => {
    if (!session || !isOrganizer) return;
    setSaving(true);
    setError(null);

    try {
      await session.transact(
        {
          actions: [
            {
              account: "artcircles",
              name: "setorder",
              authorization: [session.auth],
              data: {
                organizer: session.auth.actor,
                id: circleId,
                order: order,
              },
            },
          ],
        },
        { broadcast: true }
      );

      toast.success("Payout order saved! Members will now be asked to approve.", { duration: 4000 });
      router.push(`/c/${circleId}`);
    } catch (err: any) {
      console.error(err);
      const formatted = formatContractError(err);
      setError(formatted.message);
    } finally {
      setSaving(false);
    }
  };

  // Auth gate
  if (!session) {
    return (
      <div className="container-app" style={{ paddingTop: "var(--space-64)", maxWidth: "560px", textAlign: "center" }}>
        <div className="card" style={{ padding: "var(--space-48) var(--space-32)" }}>
          <h1 className="text-h2" style={{ marginBottom: "16px" }}>Log in required</h1>
          <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            You need to be logged in as the organizer (@{circle.organizer}) to set the payout order.
          </p>
          <button className="btn-primary btn-large" onClick={login} style={{ width: "100%" }}>
            Log in with WebAuth
          </button>
        </div>
      </div>
    );
  }

  // Permission gate
  if (!isOrganizer) {
    return (
      <div className="container-app" style={{ paddingTop: "var(--space-64)", maxWidth: "560px", textAlign: "center" }}>
        <div className="card" style={{ padding: "var(--space-48) var(--space-32)" }}>
          <div style={{ color: "var(--warning-text)", marginBottom: "16px" }}>
            <AlertCircle size={32} style={{ margin: "0 auto" }} />
          </div>
          <h1 className="text-h2" style={{ marginBottom: "12px" }}>Organizer only</h1>
          <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            Only the circle organizer (@{circle.organizer}) can set or change the payout order.
          </p>
          <Link href={`/c/${circleId}`} className="btn-secondary">
            Back to circle
          </Link>
        </div>
      </div>
    );
  }

  // State check: cannot change order if circle is active or completed
  if (circle.state !== 0) {
    return (
      <div className="container-app" style={{ paddingTop: "var(--space-64)", maxWidth: "560px", textAlign: "center" }}>
        <div className="card" style={{ padding: "var(--space-48) var(--space-32)" }}>
          <h1 className="text-h2" style={{ marginBottom: "12px" }}>Circle has started</h1>
          <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            The payout order is locked because the circle is already {circle.state === 1 ? "active" : "finished"}.
          </p>
          <Link href={`/c/${circleId}`} className="btn-primary">
            Back to circle
          </Link>
        </div>
      </div>
    );
  }

  // Check if any members have joined
  if (members.length === 0) {
    return (
      <div className="container-app" style={{ paddingTop: "var(--space-64)", maxWidth: "560px", textAlign: "center" }}>
        <div className="card" style={{ padding: "var(--space-48) var(--space-32)" }}>
          <div style={{ 
            width: "56px", 
            height: "56px", 
            borderRadius: "50%", 
            background: "var(--brand-subtle)", 
            color: "var(--brand)", 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            marginBottom: "var(--space-20)"
          }}>
            <Users size={28} />
          </div>
          <h1 className="text-h2" style={{ marginBottom: "12px" }}>Seats not filled yet</h1>
          <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            This circle does not have any members yet ({circle.maxMembers} seats total). Invite members to join before setting the payout order.
          </p>
          <Link href={`/c/${circleId}`} className="btn-primary">
            Back to circle & invite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container-app" style={{ paddingTop: "var(--space-32)", paddingBottom: "var(--space-80)", maxWidth: "600px" }}>
        {/* Back Link */}
        <div style={{ marginBottom: "var(--space-20)" }}>
          <Link href={`/c/${circleId}`} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: 0 }}>
            <ChevronLeft size={16} /> Back to {circle.name}
          </Link>
        </div>

        {/* Title and Explanation */}
        <div style={{ marginBottom: "var(--space-24)" }}>
          <h1 className="text-h1" style={{ marginBottom: "8px" }}>Payout order</h1>
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            Members will each approve this order. If you change it later, everyone approves again.
          </p>
        </div>

        {/* Helper Chips */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "var(--space-16)" }}>
          <button
            type="button"
            className="preset-chip"
            onClick={handleOrganizerLast}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ShieldCheck size={14} /> Organizer last
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={handleReverse}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Sparkles size={14} /> Reverse
          </button>
        </div>

        {/* Member Order List */}
        <div 
          className="card" 
          style={{ 
            padding: 0, 
            overflow: "hidden", 
            marginBottom: "var(--space-24)",
            border: "1px solid var(--border)"
          }}
        >
          {order.map((account, index) => {
            const isMe = account === session.auth.actor;
            const isOrg = account === circle.organizer;
            const isDragging = draggedIdx === index;

            return (
              <div
                key={account}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: index < order.length - 1 ? "1px solid var(--border)" : "none",
                  background: isDragging ? "var(--surface-muted)" : "var(--surface)",
                  cursor: "grab",
                  transition: "background-color 120ms ease",
                  userSelect: "none"
                }}
              >
                {/* Slot Number */}
                <div style={{ 
                  width: "32px", 
                  fontWeight: 700, 
                  fontSize: "15px", 
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums"
                }}>
                  {index + 1}.
                </div>

                {/* Avatar */}
                <div style={{ 
                  width: "36px", 
                  height: "36px", 
                  borderRadius: "50%", 
                  background: index === 0 ? "var(--pot-subtle)" : "var(--brand-subtle)", 
                  color: index === 0 ? "var(--pot-text)" : "var(--brand)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontWeight: 700, 
                  marginRight: "14px",
                  flexShrink: 0
                }}>
                  {account[0]?.toUpperCase()}
                </div>

                {/* Account & Round Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: isMe ? 700 : 600, fontSize: "16px", color: "var(--text)" }}>
                      {account}
                    </span>
                    {isMe && <span className="text-caption" style={{ fontWeight: 600, color: "var(--brand)" }}>(you)</span>}
                    {isOrg && <span className="text-caption" style={{ color: "var(--text-secondary)" }}>(organizer)</span>}
                  </div>
                  <p className="text-caption" style={{ marginTop: "2px" }}>
                    Takes the pot in round {index + 1} ({pot} USDC)
                  </p>
                </div>

                {/* Keyboard Reordering Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginRight: "12px" }}>
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="stepper-btn"
                    style={{ width: "32px", height: "32px", fontSize: "14px" }}
                    aria-label={`Move ${account} up`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === order.length - 1}
                    className="stepper-btn"
                    style={{ width: "32px", height: "32px", fontSize: "14px" }}
                    aria-label={`Move ${account} down`}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                {/* Drag Handle */}
                <div style={{ color: "var(--border-strong)", cursor: "grab" }}>
                  <GripVertical size={20} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message banner */}
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

        {/* Bottom Actions */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href={`/c/${circleId}`} className="btn-secondary btn-large" style={{ flex: "0 0 120px" }}>
            Cancel
          </Link>
          <button
            type="button"
            className="btn-primary btn-large"
            onClick={handleSaveOrder}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? "Confirming on wallet..." : "Save order"}
          </button>
        </div>
      </div>

      <Footer slim />
    </>
  );
}
