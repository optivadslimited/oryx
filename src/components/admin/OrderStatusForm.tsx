"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

export default function OrderStatusForm({
  orderId,
  currentStatus,
  trackingNumber,
  trackingProvider,
  adminNotes,
}: {
  orderId: string;
  currentStatus: string;
  trackingNumber: string | null;
  trackingProvider: string | null;
  adminNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [provider, setProvider] = useState(trackingProvider ?? "");
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          trackingNumber: tracking || undefined,
          trackingProvider: provider || undefined,
          adminNotes: notes || undefined,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8E4DE] rounded p-6 space-y-4">
      <h2 className="text-lg font-semibold text-black">Update order status</h2>
      <p className="text-sm text-black">
        When you confirm an order, stock is deducted. Use <strong>shipped</strong> /{" "}
        <strong>delivered</strong> when the delivery company updates you. You can also connect a
        delivery API via the webhook (Settings) to update status automatically.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Tracking number</label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. 1Z999..."
            className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Tracking provider</label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. Amana, Aramex"
            className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Internal notes (admin only)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes for your team — not visible to customer"
          className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-medium uppercase tracking-wide hover:bg-[#C9A84C] hover:text-black disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
