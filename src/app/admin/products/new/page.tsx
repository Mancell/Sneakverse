import { requireEditor } from "@/lib/auth/admin";
import { getFormData } from "@/lib/actions/admin/products";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await requireEditor();

  const formData = await getFormData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Add New Product</h1>
        <p className="text-body text-dark-700 mt-2">
          Create a new product and its initial variant
        </p>
      </div>

      <ProductForm
        brands={formData.brands}
        categories={formData.categories}
        genders={formData.genders}
        colors={formData.colors}
        sizes={formData.sizes}
      />
    </div>
  );
}

