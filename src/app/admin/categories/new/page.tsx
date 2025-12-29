import { requireEditor } from "@/lib/auth/admin";
import { getAdminCategories } from "@/lib/actions/admin/categories";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function NewCategoryPage() {
  await requireEditor();

  const { categories } = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Create New Category</h1>
        <p className="text-body text-dark-700 mt-2">Add a new product category</p>
      </div>

      <CategoryForm categories={categories} />
    </div>
  );
}

