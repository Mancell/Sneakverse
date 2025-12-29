import { requireEditor } from "@/lib/auth/admin";
import { getCategoryForEdit, getAdminCategories } from "@/lib/actions/admin/categories";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEditor();

  const { id } = await params;
  const category = await getCategoryForEdit(id);

  if (!category) {
    notFound();
  }

  const { categories } = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Edit Category</h1>
        <p className="text-body text-dark-700 mt-2">Update category information</p>
      </div>

      <CategoryForm category={category} categories={categories} />
    </div>
  );
}

