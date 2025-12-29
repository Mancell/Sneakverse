"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPriceHistory, deletePriceHistory } from "@/lib/actions/admin/price-history";
import { Plus, Trash2, TrendingUp } from "lucide-react";

interface PriceHistoryEntry {
  id: string;
  price: string;
  salePrice: string | null;
  recordedAt: Date;
}

interface PriceHistoryManagerProps {
  productId: string;
  entries: PriceHistoryEntry[];
}

export default function PriceHistoryManager({
  productId,
  entries,
}: PriceHistoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      productId,
      price: formData.get("price") as string,
      salePrice: (formData.get("salePrice") as string) || null,
      recordedAt: formData.get("recordedAt")
        ? new Date(formData.get("recordedAt") as string)
        : new Date(),
    };

    startTransition(async () => {
      try {
        await createPriceHistory(data);
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this price history entry?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deletePriceHistory(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete entry");
      }
    });
  };

  return (
    <div className="rounded-xl border border-light-300 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading-3 text-dark-900">Price History</h2>
        {!showForm && (
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

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-light-300 bg-light-50 p-4">
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Price *</label>
            <input
              type="number"
              name="price"
              step="0.01"
              required
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Sale Price</label>
            <input
              type="number"
              name="salePrice"
              step="0.01"
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Date</label>
            <input
              type="datetime-local"
              name="recordedAt"
              defaultValue={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-dark-900 px-3 py-1.5 text-caption font-medium text-light-100 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-caption text-dark-700">No price history yet</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-light-300 bg-light-50 p-3"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-dark-500" />
                <div>
                  <p className="text-caption font-medium text-dark-900">
                    ${Number(entry.price).toFixed(2)}
                    {entry.salePrice && (
                      <span className="ml-2 text-footnote text-red-600 line-through">
                        ${Number(entry.salePrice).toFixed(2)}
                      </span>
                    )}
                  </p>
                  <p className="text-footnote text-dark-700">
                    {new Date(entry.recordedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={isPending}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
