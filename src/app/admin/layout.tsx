import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  // Login page doesn't need nav
  if (!session) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <AdminNav user={session} />
      <main className="p-6 md:p-8">{children}</main>
    </div>
  );
}
