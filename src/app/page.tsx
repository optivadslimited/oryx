import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-4">
      <h1 className="font-serif text-4xl font-semibold text-[#0A0F1E] tracking-wide">
        ORYX
      </h1>
      <p className="text-[#888] mt-2">Born in Morocco. Built for everywhere.</p>
      <Link
        href="/admin/login"
        className="mt-8 px-6 py-3 border border-[#1B2A4A] text-[#1B2A4A] font-medium uppercase tracking-wide hover:bg-[#1B2A4A] hover:text-white transition-colors"
      >
        Admin login
      </Link>
    </div>
  );
}
