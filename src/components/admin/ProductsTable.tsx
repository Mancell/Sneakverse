"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProduct, toggleProductPublish } from "@/lib/actions/admin/products";
import { Trash2, Eye, EyeOff, Edit } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductsTableProps {
  products: Product[];
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteProduct(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleProductPublish(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
      alert("Failed to update publish status");
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
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Name</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Status</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Created</th>
              <th className="px-6 py-3 text-right text-caption font-medium text-dark-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-300">
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-body text-dark-700">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-light-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body font-medium text-dark-900">{product.name}</p>
                      <p className="mt-1 text-caption text-dark-700 line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-caption ${
                        product.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-caption text-dark-700">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTogglePublish(product.id)}
                        disabled={togglingId === product.id}
                        className="rounded-lg p-2 text-dark-700 transition-colors hover:bg-light-100 disabled:opacity-50"
                        title={product.isPublished ? "Unpublish" : "Publish"}
                      >
                        {product.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-lg p-2 text-dark-700 transition-colors hover:bg-light-100"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
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

