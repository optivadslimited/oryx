"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-4">
      <h1 className="text-xl font-semibold text-black mb-2">
        Something went wrong
      </h1>
      {isDev && (
        <pre className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-left text-sm text-black overflow-auto max-w-lg">
          {error.message}
        </pre>
      )}
      <p className="text-black text-sm mb-6">
        {isDev
          ? "Check the terminal and the message above for details."
          : "Please try again or contact support."}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-medium hover:bg-[#C9A84C] hover:text-black"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-[#1B2A4A] text-black text-sm font-medium hover:bg-[#1B2A4A] hover:text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
