"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";
  const isDbError =
    error.message?.includes("database") ||
    error.message?.includes("DATABASE") ||
    error.message?.includes("Unable to open");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-4">
      <h1 className="text-xl font-semibold text-black mb-2">
        Admin error
      </h1>
      {isDev && (
        <pre className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-left text-sm text-black overflow-auto max-w-lg whitespace-pre-wrap">
          {error.message}
        </pre>
      )}
      {isDbError && (
        <p className="mb-2 text-sm text-black max-w-md text-center">
          Database connection failed. Run from the project root:{" "}
          <code className="bg-[#E8E4DE] px-1 rounded">npx prisma db push</code> then{" "}
          <code className="bg-[#E8E4DE] px-1 rounded">npm run db:seed</code>. Ensure{" "}
          <code className="bg-[#E8E4DE] px-1 rounded">.env</code> has{" "}
          <code className="bg-[#E8E4DE] px-1 rounded">DATABASE_URL="file:./prisma/dev.db"</code>.
        </p>
      )}
      <p className="text-black text-sm mb-6">
        {isDev ? "See the message above for details." : "Please try again."}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-medium hover:bg-[#C9A84C] hover:text-black"
        >
          Try again
        </button>
        <Link
          href="/admin/login"
          className="px-4 py-2 border border-[#1B2A4A] text-black text-sm font-medium hover:bg-[#1B2A4A] hover:text-white"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
