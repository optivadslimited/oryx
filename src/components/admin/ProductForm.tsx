"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Collection = { id: string; name: string; slug: string };
type Variant = {
  id?: string;
  colorName: string;
  colorHex: string;
  sku: string;
  priceMad: number;
  priceEur: number;
  comparePriceMad?: number | null;
  comparePriceEur?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isDefault: boolean;
  sortOrder: number;
  images?: { id: string; url: string; altText?: string | null; sortOrder: number }[];
};
type Product = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  collectionId: string | null;
  frameStyle: string;
  genderTarget: string[];
  frameMaterial: string;
  lensType: string;
  lensColor: string;
  templeLengthMm: number | null;
  bridgeWidthMm: number | null;
  lensWidthMm: number | null;
  weightGrams: number | null;
  status: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  variants: Variant[];
};

const FRAME_STYLES = ["Aviator", "Wayfarer", "Round", "Square", "Other"];
const GENDERS = ["Men", "Women", "Unisex"];

export default function ProductForm({
  collections,
  product: initialProduct,
}: {
  collections: Collection[];
  product?: Product | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct?.id);

  const [product, setProduct] = useState<Product>(
    initialProduct ?? {
      name: "",
      slug: "",
      shortDescription: "",
      longDescription: "",
      collectionId: null,
      frameStyle: "",
      genderTarget: [],
      frameMaterial: "",
      lensType: "",
      lensColor: "",
      templeLengthMm: null,
      bridgeWidthMm: null,
      lensWidthMm: null,
      weightGrams: null,
      status: "active",
      featured: false,
      seoTitle: "",
      seoDescription: "",
      variants: [
        {
          colorName: "",
          colorHex: "#000000",
          sku: "",
          priceMad: 0,
          priceEur: 0,
          comparePriceMad: null,
          comparePriceEur: null,
          stockQuantity: 0,
          lowStockThreshold: 5,
          isDefault: true,
          sortOrder: 0,
          images: [],
        },
      ],
    }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function updateProduct(updates: Partial<Product>) {
    setProduct((p) => ({ ...p, ...updates }));
    if (updates.name && !isEdit) {
      setProduct((p) => ({ ...p, slug: slugify(updates.name!) }));
    }
  }

  function updateVariant(index: number, updates: Partial<Variant>) {
    setProduct((p) => {
      const v = [...p.variants];
      v[index] = { ...v[index], ...updates };
      return { ...p, variants: v };
    });
  }

  function addVariant() {
    setProduct((p) => ({
      ...p,
      variants: [
        ...p.variants,
        {
          colorName: "",
          colorHex: "#888888",
          sku: "",
          priceMad: 0,
          priceEur: 0,
          comparePriceMad: null,
          comparePriceEur: null,
          stockQuantity: 0,
          lowStockThreshold: 5,
          isDefault: false,
          sortOrder: p.variants.length,
          images: [],
        },
      ],
    }));
  }

  function removeVariant(index: number) {
    if (product.variants.length <= 1) return;
    setProduct((p) => ({
      ...p,
      variants: p.variants.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...product,
        variants: product.variants.map((v) => ({
          id: v.id,
          colorName: v.colorName || "Default",
          colorHex: v.colorHex,
          sku: v.sku,
          priceMad: Number(v.priceMad),
          priceEur: Number(v.priceEur),
          comparePriceMad: v.comparePriceMad != null ? Number(v.comparePriceMad) : null,
          comparePriceEur: v.comparePriceEur != null ? Number(v.comparePriceEur) : null,
          stockQuantity: Number(v.stockQuantity),
          lowStockThreshold: Number(v.lowStockThreshold ?? 5),
          isDefault: v.isDefault,
          sortOrder: v.sortOrder,
        })),
      };

      const url = isEdit
        ? `/api/v1/admin/products/${product.id}`
        : "/api/v1/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Save failed");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-black rounded text-sm">
          {error}
        </div>
      )}

      <section className="bg-white border border-[#E8E4DE] rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold text-black">Basic info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Product name *</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => updateProduct({ name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">URL slug</label>
            <input
              type="text"
              value={product.slug}
              onChange={(e) => updateProduct({ slug: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded font-mono text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Short description</label>
          <textarea
            value={product.shortDescription}
            onChange={(e) => updateProduct({ shortDescription: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Long description (HTML ok)</label>
          <textarea
            value={product.longDescription}
            onChange={(e) => updateProduct({ longDescription: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Collection</label>
            <select
              value={product.collectionId ?? ""}
              onChange={(e) => updateProduct({ collectionId: e.target.value || null })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            >
              <option value="">— None —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Frame style</label>
            <select
              value={product.frameStyle}
              onChange={(e) => updateProduct({ frameStyle: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            >
              <option value="">— Select —</option>
              {FRAME_STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Gender target</label>
          <div className="flex gap-4">
            {GENDERS.map((g) => (
              <label key={g} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={product.genderTarget.includes(g)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...product.genderTarget, g]
                      : product.genderTarget.filter((x) => x !== g);
                    updateProduct({ genderTarget: next });
                  }}
                />
                <span className="text-sm">{g}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Frame material</label>
            <input
              type="text"
              value={product.frameMaterial}
              onChange={(e) => updateProduct({ frameMaterial: e.target.value })}
              placeholder="e.g. Acetate"
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Lens type</label>
            <input
              type="text"
              value={product.lensType}
              onChange={(e) => updateProduct({ lensType: e.target.value })}
              placeholder="e.g. UV400"
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Lens color</label>
            <input
              type="text"
              value={product.lensColor}
              onChange={(e) => updateProduct({ lensColor: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Temple (mm)</label>
            <input
              type="number"
              value={product.templeLengthMm ?? ""}
              onChange={(e) => updateProduct({ templeLengthMm: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Bridge (mm)</label>
            <input
              type="number"
              value={product.bridgeWidthMm ?? ""}
              onChange={(e) => updateProduct({ bridgeWidthMm: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Lens width (mm)</label>
            <input
              type="number"
              value={product.lensWidthMm ?? ""}
              onChange={(e) => updateProduct({ lensWidthMm: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Weight (g)</label>
            <input
              type="number"
              value={product.weightGrams ?? ""}
              onChange={(e) => updateProduct({ weightGrams: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.status === "active"}
              onChange={(e) => updateProduct({ status: e.target.checked ? "active" : "archived" })}
            />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.featured}
              onChange={(e) => updateProduct({ featured: e.target.checked })}
            />
            <span className="text-sm">Featured on homepage</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">SEO title</label>
            <input
              type="text"
              value={product.seoTitle}
              onChange={(e) => updateProduct({ seoTitle: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">SEO description</label>
            <input
              type="text"
              value={product.seoDescription}
              onChange={(e) => updateProduct({ seoDescription: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#E8E4DE] rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">Variants (colorways)</h2>
          <button
            type="button"
            onClick={addVariant}
            className="text-sm text-[#C9A84C] hover:underline"
          >
            + Add colorway
          </button>
        </div>
        <p className="text-sm text-black">
          Each variant has its own price, compare-at price (for promotions), stock, and images.
        </p>

        {product.variants.map((variant, index) => (
          <div
            key={variant.id ?? index}
            className="border border-[#E8E4DE] rounded p-4 space-y-4 bg-[#FAF8F4]"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-black">
                Variant {index + 1}
                {variant.isDefault && (
                  <span className="ml-2 text-xs text-[#C9A84C]">(default)</span>
                )}
              </span>
              {product.variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-sm text-black hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Color name</label>
                <input
                  type="text"
                  value={variant.colorName}
                  onChange={(e) => updateVariant(index, { colorName: e.target.value })}
                  placeholder="e.g. Midnight Black"
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={variant.colorHex}
                    onChange={(e) => updateVariant(index, { colorHex: e.target.value })}
                    className="w-10 h-10 rounded border border-[#E8E4DE] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={variant.colorHex}
                    onChange={(e) => updateVariant(index, { colorHex: e.target.value })}
                    className="flex-1 px-3 py-2 border border-[#E8E4DE] rounded font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                  placeholder="ORX-01-BLK"
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded font-mono"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={variant.isDefault}
                    onChange={(e) => {
                      setProduct((p) => ({
                        ...p,
                        variants: p.variants.map((v, i) => ({
                          ...v,
                          isDefault: i === index ? e.target.checked : false,
                        })),
                      }));
                    }}
                  />
                  <span className="text-sm">Default variant</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Price MAD *</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={variant.priceMad || ""}
                  onChange={(e) => updateVariant(index, { priceMad: Number(e.target.value) || 0 })}
                  required
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Price EUR *</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={variant.priceEur || ""}
                  onChange={(e) => updateVariant(index, { priceEur: Number(e.target.value) || 0 })}
                  required
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Compare price MAD (old/promo)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={variant.comparePriceMad ?? ""}
                  onChange={(e) =>
                    updateVariant(index, {
                      comparePriceMad: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Compare price EUR (old/promo)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={variant.comparePriceEur ?? ""}
                  onChange={(e) =>
                    updateVariant(index, {
                      comparePriceEur: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Stock quantity</label>
                <input
                  type="number"
                  min={0}
                  value={variant.stockQuantity}
                  onChange={(e) => updateVariant(index, { stockQuantity: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Low stock threshold</label>
                <input
                  type="number"
                  min={0}
                  value={variant.lowStockThreshold}
                  onChange={(e) => updateVariant(index, { lowStockThreshold: Number(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-[#E8E4DE] rounded"
                />
              </div>
            </div>
            {variant.images && variant.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">Images</label>
                <div className="flex flex-wrap gap-2">
                  {variant.images.map((img) => (
                    <div key={img.id} className="w-20 h-20 rounded border border-[#E8E4DE] overflow-hidden">
                      <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-black mt-1">
                  Upload new images in Edit mode after saving. First image = primary, second = hover.
                </p>
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#1B2A4A] text-white font-medium uppercase tracking-wide hover:bg-[#C9A84C] hover:text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Update product" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-[#1B2A4A] text-black font-medium uppercase tracking-wide hover:bg-[#1B2A4A] hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
