"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type AdminSession = { userId: string; email: string };

export default function AdminNav({ user }: { user: AdminSession }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/v1/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/collections", label: "Collections" },
    { href: "/admin/content", label: "Content" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <header className="bg-white border-b border-[#E8E4DE] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/admin/dashboard" className="font-serif text-xl font-semibold text-[#0A0F1E]">
          ORYX Admin
        </Link>
        <nav className="flex items-center gap-6">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium uppercase tracking-wide ${
                pathname.startsWith(href)
                  ? "text-[#C9A84C] border-b-2 border-[#C9A84C]"
                  : "text-[#1B2A4A] hover:text-[#C9A84C]"
              }`}
            >
              {label}
            </Link>
          ))}
          <span className="text-sm text-[#888] hidden sm:inline">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-[#888] hover:text-[#1A1A1A]"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
