"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVariant, updateVariant, deleteVariant } from "@/lib/actions/admin/products";
import { Plus, Trash2, Edit } from "lucide-react";

interface Variant {
  id: string;
  sku: string;
  price: string;
  salePrice: string | null;
  colorId: string;
  sizeId: string;
  inStock: number;
  weight: number | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
}

interface VariantsManagerProps {
  productId: string;
  variants: Variant[];
  colors: Array<{ id: string; name: string }>;
  sizes: Array<{ id: string; name: string }>;
}

export default function VariantsManager({
  productId,
  variants,
  colors,
  sizes,
}: VariantsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      productId,
      sku: formData.get("sku") as string,
      price: formData.get("price") as string,
      salePrice: formData.get("salePrice") as string || null,
      colorId: formData.get("colorId") as string,
      sizeId: formData.get("sizeId") as string,
      inStock: parseInt(formData.get("inStock") as string) || 0,
      weight: formData.get("weight") ? parseFloat(formData.get("weight") as string) : null,
      dimensions: formData.get("dimensionsLength") && formData.get("dimensionsWidth") && formData.get("dimensionsHeight")
        ? {
            length: parseFloat(formData.get("dimensionsLength") as string),
            width: parseFloat(formData.get("dimensionsWidth") as string),
            height: parseFloat(formData.get("dimensionsHeight") as string),
          }
        : null,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateVariant(editingId, data);
          setEditingId(null);
        } else {
          await createVariant(data);
        }
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteVariant(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete variant");
      }
    });
  };

  const editingVariant = editingId ? variants.find((v) => v.id === editingId) : null;

  return (
    <div className="rounded-xl border border-light-300 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading-3 text-dark-900">Variants</h2>
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-dark-900 px-3 py-1.5 text-caption font-medium text-light-100 transition-colors hover:bg-dark-800"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-caption text-red-800">
          {error}
        </div>
      )}

      {(showForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-light-300 bg-light-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">SKU *</label>
              <input
                type="text"
                name="sku"
                defaultValue={editingVariant?.sku}
                required
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">Price *</label>
              <input
                type="number"
                name="price"
                step="0.01"
                defaultValue={editingVariant?.price}
                required
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">Sale Price</label>
              <input
                type="number"
                name="salePrice"
                step="0.01"
                defaultValue={editingVariant?.salePrice || ""}
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">In Stock *</label>
              <input
                type="number"
                name="inStock"
                min="0"
                defaultValue={editingVariant?.inStock || 0}
                required
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">Color *</label>
              <select
                name="colorId"
                defaultValue={editingVariant?.colorId || ""}
                required
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              >
                <option value="">Select</option>
                {colors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">Size *</label>
              <select
                name="sizeId"
                defaultValue={editingVariant?.sizeId || ""}
                required
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              >
                <option value="">Select</option>
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-dark-900 px-3 py-1.5 text-caption font-medium text-light-100 disabled:opacity-50"
            >
              {isPending ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {variants.length === 0 ? (
          <p className="text-caption text-dark-700">No variants yet</p>
        ) : (
          variants.map((variant) => {
            const color = colors.find((c) => c.id === variant.colorId);
            const size = sizes.find((s) => s.id === variant.sizeId);
            return (
              <div
                key={variant.id}
                className="flex items-center justify-between rounded-lg border border-light-300 bg-light-50 p-3"
              >
                <div className="flex-1">
                  <p className="text-caption font-medium text-dark-900">{variant.sku}</p>
                  <p className="text-footnote text-dark-700">
                    {color?.name} / {size?.name} - ${variant.price}
                    {variant.salePrice && (
                      <span className="ml-1 text-red-600 line-through">${variant.salePrice}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(variant.id);
                      setShowForm(false);
                    }}
                    className="rounded-lg p-1.5 text-dark-700 hover:bg-light-200"
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(variant.id)}
                    disabled={isPending}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

