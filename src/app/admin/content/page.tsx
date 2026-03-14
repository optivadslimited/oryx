import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const blocks = await prisma.contentBlock.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold text-[#0A0F1E] mb-6">
        Content
      </h1>
      <p className="text-sm text-[#888] mb-4">
        Edit hero, brand story, FAQ, and footer content. Full editor coming in a future update.
      </p>
      <div className="space-y-3">
        {blocks.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-[#E8E4DE] rounded p-4"
          >
            <p className="font-medium text-[#1A1A1A]">{b.key}</p>
            <p className="text-sm text-[#888] truncate">{b.title ?? b.body ?? "—"}</p>
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="text-[#888]">No content blocks. Run db:seed to create defaults.</p>
        )}
      </div>
    </div>
  );
}
