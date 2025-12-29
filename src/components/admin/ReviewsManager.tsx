"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReview, deleteReview } from "@/lib/actions/admin/reviews-admin";
import { Plus, Trash2, Star, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  userId: string | null;
  reviewerName: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

interface ReviewsManagerProps {
  productId: string;
  reviews: Review[];
  users: Array<{ id: string; name: string | null; email: string }>;
}

export default function ReviewsManager({ productId, reviews, users }: ReviewsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const reviewerName = (formData.get("reviewerName") as string) || null;
    const userId = (formData.get("userId") as string) || null;

    if (!reviewerName && !userId) {
      setError("Please enter a reviewer name or select a user");
      return;
    }

    const data = {
      productId,
      userId: userId || null,
      reviewerName: reviewerName || null,
      rating: parseInt(formData.get("rating") as string),
      comment: (formData.get("comment") as string) || null,
      createdAt: formData.get("createdAt")
        ? new Date(formData.get("createdAt") as string)
        : new Date(),
    };

    startTransition(async () => {
      try {
        await createReview(data);
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteReview(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete review");
      }
    });
  };

  const getReviewerName = (review: Review) => {
    if (review.reviewerName) {
      return review.reviewerName;
    }
    if (review.userId) {
      const user = users.find((u) => u.id === review.userId);
      return user?.name || user?.email || "Unknown User";
    }
    return "Anonymous";
  };

  return (
    <div className="rounded-xl border border-light-300 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading-3 text-dark-900">Reviews</h2>
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
            <label className="block text-caption font-medium text-dark-900 mb-1">Reviewer Name *</label>
            <input
              type="text"
              name="reviewerName"
              placeholder="Enter reviewer name (e.g., John Doe)"
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            />
            <p className="mt-1 text-footnote text-dark-700">Or select a user below</p>
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">User (Optional)</label>
            <select
              name="userId"
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            >
              <option value="">Select User (optional)</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Rating *</label>
            <select
              name="rating"
              required
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            >
              <option value="">Select Rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Comment</label>
            <textarea
              name="comment"
              rows={3}
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Date</label>
            <input
              type="datetime-local"
              name="createdAt"
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
        {reviews.length === 0 ? (
          <p className="text-caption text-dark-700">No reviews yet</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-light-300 bg-light-50 p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-dark-500" />
                  <p className="text-caption font-medium text-dark-900">
                    {getReviewerName(review)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-light-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-footnote text-dark-700 mb-2 line-clamp-2">{review.comment}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-footnote text-dark-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={isPending}
                  className="rounded-lg p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
