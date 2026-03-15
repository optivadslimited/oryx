"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "active" | "archived";

export default function ProductStatusToggle({
  productId,
  status,
}: {
  productId: string;
  status: Status;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "active" ? "archived" : "active",
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
        status === "active"
          ? "bg-green-100 text-black"
          : "bg-gray-100 text-black"
      } hover:opacity-80 disabled:opacity-50`}
    >
      {loading ? "…" : status}
    </button>
  );
}
