export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold text-black mb-6">
        Settings
      </h1>

      <div className="bg-white border border-[#E8E4DE] rounded p-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-black mb-2">Delivery API (webhook)</h2>
          <p className="text-sm text-black mb-2">
            To update order status automatically from your delivery provider, set{" "}
            <code className="bg-[#F0EAE0] px-1 rounded">DELIVERY_WEBHOOK_SECRET</code> in your
            environment. Then call:
          </p>
          <pre className="bg-[#F0EAE0] p-4 rounded text-sm overflow-x-auto">
{`POST /api/v1/delivery/webhook
Content-Type: application/json

{
  "order_number": "ORX-20260001",
  "status": "shipped" | "delivered" | "returned",
  "tracking_number": "optional",
  "secret": "<your DELIVERY_WEBHOOK_SECRET>"
}`}
          </pre>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black mb-2">Admin account</h2>
          <p className="text-sm text-black">
            Change password and email via environment and re-seed, or add a dedicated settings form in a future update.
          </p>
        </section>
      </div>
    </div>
  );
}
