"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Variant = {
  id: string;
  colorName: string;
  sku: string;
  priceMad: number;
  priceEur: number;
  stockQuantity: number;
};

type Product = {
  id: string;
  name: string;
  variants: Variant[];
};

export default function ManualOrderForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const flatVariants = products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, productName: p.name }))
  );

  const [customer, setCustomer] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    city: "",
    address: "",
    country: "Morocco",
    paymentMethod: "cod" as "cod" | "bank_transfer" | "other",
    paymentNotes: "",
    specialNotes: "",
  });

  const [items, setItems] = useState<{ variantId: string; quantity: number }[]>([
    { variantId: "", quantity: 1 },
  ]);

  const addLine = () => setItems((prev) => [...prev, { variantId: "", quantity: 1 }]);
  const removeLine = (i: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const updateItem = (i: number, field: "variantId" | "quantity", value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === "variantId") next[i] = { ...next[i], variantId: value as string };
      else next[i] = { ...next[i], quantity: Number(value) || 1 };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customer.customerName.trim() || !customer.customerPhone.trim() || !customer.customerEmail.trim()) {
      setError("Name, phone and email are required.");
      return;
    }
    const validItems = items.filter((i) => i.variantId && i.quantity >= 1 && i.quantity <= 10);
    if (validItems.length === 0) {
      setError("Add at least one item with a variant and quantity (1–10).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customer,
          items: validItems,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to create order");
        return;
      }
      if (data.orderId) router.push(`/admin/orders/${data.orderId}`);
      else router.push("/admin/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-black text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E8E4DE] rounded shadow-sm p-5">
        <h2 className="text-lg font-semibold text-black mb-4">Customer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2">
            <span className="block text-sm text-black mb-1">Full name *</span>
            <input
              type="text"
              required
              value={customer.customerName}
              onChange={(e) => setCustomer((c) => ({ ...c, customerName: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            />
          </label>
          <label>
            <span className="block text-sm text-black mb-1">Phone *</span>
            <input
              type="tel"
              required
              value={customer.customerPhone}
              onChange={(e) => setCustomer((c) => ({ ...c, customerPhone: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            />
          </label>
          <label>
            <span className="block text-sm text-black mb-1">Email *</span>
            <input
              type="email"
              required
              value={customer.customerEmail}
              onChange={(e) => setCustomer((c) => ({ ...c, customerEmail: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            />
          </label>
          <label>
            <span className="block text-sm text-black mb-1">City</span>
            <input
              type="text"
              value={customer.city}
              onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            />
          </label>
          <label>
            <span className="block text-sm text-black mb-1">Country</span>
            <input
              type="text"
              value={customer.country}
              onChange={(e) => setCustomer((c) => ({ ...c, country: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="block text-sm text-black mb-1">Address</span>
            <input
              type="text"
              value={customer.address}
              onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="block text-sm text-black mb-1">Payment method</span>
            <select
              value={customer.paymentMethod}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, paymentMethod: e.target.value as "cod" | "bank_transfer" | "other" }))
              }
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            >
              <option value="cod">Cash on delivery</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="block text-sm text-black mb-1">Payment notes</span>
            <input
              type="text"
              value={customer.paymentNotes}
              onChange={(e) => setCustomer((c) => ({ ...c, paymentNotes: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="block text-sm text-black mb-1">Special notes</span>
            <textarea
              value={customer.specialNotes}
              onChange={(e) => setCustomer((c) => ({ ...c, specialNotes: e.target.value }))}
              className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
              rows={2}
            />
          </label>
        </div>
      </div>

      <div className="bg-white border border-[#E8E4DE] rounded shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Items</h2>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-black hover:text-[#C9A84C]"
          >
            + Add line
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[200px]">
                <span className="block text-sm text-black mb-1">Product / variant</span>
                <select
                  value={item.variantId}
                  onChange={(e) => updateItem(i, "variantId", e.target.value)}
                  className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
                >
                  <option value="">Select variant…</option>
                  {flatVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.productName} — {v.colorName} ({v.sku}) — {v.stockQuantity} in stock
                    </option>
                  ))}
                </select>
              </label>
              <label className="w-24">
                <span className="block text-sm text-black mb-1">Qty</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-black"
                />
              </label>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="py-2 text-black hover:text-black"
                aria-label="Remove line"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-medium uppercase tracking-wide hover:bg-[#C9A84C] hover:text-black disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create order"}
        </button>
        <Link
          href="/admin/orders"
          className="px-4 py-2 border border-[#E8E4DE] text-black text-sm font-medium hover:bg-[#F0EAE0]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
