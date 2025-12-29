"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteReview, setFeaturedReview } from "@/lib/actions/admin/reviews";
import { Trash2, Star } from "lucide-react";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  isFeatured: boolean;
  product: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ReviewsTableProps {
  reviews: Review[];
}

export default function ReviewsTable({ reviews }: ReviewsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteReview(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      await setFeaturedReview(id, !currentStatus);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle featured status:", error);
      alert("Failed to update featured status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-light-300 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-light-100">
            <tr>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Product</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">User</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Rating</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Comment</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Date</th>
              <th className="px-6 py-3 text-right text-caption font-medium text-dark-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-300">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-body text-dark-700">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-light-50">
                  <td className="px-6 py-4">
                    {review.product ? (
                      <Link
                        href={`/products/${review.product.id}`}
                        className="text-body text-dark-900 hover:underline"
                      >
                        {review.product.name}
                      </Link>
                    ) : (
                      <span className="text-caption text-dark-500">Unknown Product</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body text-dark-900">{review.user?.name || "Unknown"}</p>
                      <p className="text-caption text-dark-700">{review.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-light-300"
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body text-dark-900 line-clamp-2">
                      {review.comment || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-caption text-dark-700">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleFeatured(review.id, review.isFeatured)}
                        disabled={togglingId === review.id}
                        className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                          review.isFeatured
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "text-dark-700 hover:bg-light-100"
                        }`}
                        title={review.isFeatured ? "Remove from featured" : "Set as featured"}
                      >
                        <Star
                          className={`h-4 w-4 ${review.isFeatured ? "fill-current" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

