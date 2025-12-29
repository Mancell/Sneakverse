"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCategory } from "@/lib/actions/admin/categories";
import { Trash2, Edit, ChevronRight, ChevronDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface CategoriesTableProps {
  categories: Category[];
  hierarchical: Array<Category & { children: Category[] }>;
}

export default function CategoriesTable({ categories, hierarchical }: CategoriesTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteCategory(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert(error instanceof Error ? error.message : "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderCategory = (category: Category & { children?: Category[] }, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 rounded-lg border border-light-300 bg-white p-4 hover:bg-light-50 ${
            level > 0 ? "ml-8" : ""
          }`}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="rounded-lg p-1 text-dark-700 hover:bg-light-100"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div className="flex-1">
            <p className="text-body font-medium text-dark-900">{category.name}</p>
            <p className="text-caption text-dark-700">{category.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/categories/${category.id}/edit`}
              className="rounded-lg p-2 text-dark-700 transition-colors hover:bg-light-100"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleDelete(category.id)}
              disabled={deletingId === category.id}
              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {hierarchical.length === 0 ? (
        <div className="rounded-xl border border-light-300 bg-white p-8 text-center">
          <p className="text-body text-dark-700">No categories found</p>
        </div>
      ) : (
        hierarchical.map((category) => renderCategory(category))
      )}
    </div>
  );
}

