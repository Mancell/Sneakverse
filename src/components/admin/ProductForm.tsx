"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, getFormData } from "@/lib/actions/admin/products";
import { createBrand } from "@/lib/actions/admin/brands";
import { createCategoryQuick } from "@/lib/actions/admin/categories-quick";
import { Plus } from "lucide-react";

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description: string;
    brandId: string | null;
    categoryId: string | null;
    genderId: string | null;
    isPublished: boolean;
    amazonUrl: string | null;
    manualRating: string | null;
    manualReviewCount: number | null;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
  };
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  genders: Array<{ id: string; label: string }>;
  colors: Array<{ id: string; name: string }>;
  sizes: Array<{ id: string; name: string }>;
}

export default function ProductForm({
  product,
  brands,
  categories,
  genders,
  colors,
  sizes,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [brandsList, setBrandsList] = useState(brands);
  const [categoriesList, setCategoriesList] = useState(categories);

  const isEditMode = !!product;

  const handleAddBrand = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const form = (e.currentTarget.closest('.brand-form-container') as HTMLElement)?.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const name = formData.get("brandName") as string;
    const logoUrl = formData.get("brandLogoUrl") as string || null;

    if (!name) {
      setError("Brand name is required");
      return;
    }

    try {
      const result = await createBrand({ name, logoUrl });
      if (result.success && result.brand) {
        setBrandsList([...brandsList, result.brand]);
        setShowBrandForm(false);
        // Set the newly created brand as selected
        const selectElement = document.getElementById("brandId") as HTMLSelectElement;
        if (selectElement) {
          selectElement.value = result.brand.id;
        }
        form.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brand");
    }
  };

  const handleAddCategory = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const form = (e.currentTarget.closest('.category-form-container') as HTMLElement)?.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const name = formData.get("categoryName") as string;
    const parentId = formData.get("categoryParentId") as string || null;

    if (!name) {
      setError("Category name is required");
      return;
    }

    try {
      const result = await createCategoryQuick({ name, parentId });
      if (result.success && result.category) {
        setCategoriesList([...categoriesList, result.category]);
        setShowCategoryForm(false);
        // Set the newly created category as selected
        const selectElement = document.getElementById("categoryId") as HTMLSelectElement;
        if (selectElement) {
          selectElement.value = result.category.id;
        }
        form.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Manual Rating - boş string kontrolü ve numeric'e çevirme
    const manualRatingValue = formData.get("manualRating") as string;
    const manualRating = manualRatingValue && manualRatingValue.trim() !== "" 
      ? manualRatingValue.trim() 
      : null;
    
    // Manual Review Count - boş string ve NaN kontrolü
    const manualReviewCountValue = formData.get("manualReviewCount") as string;
    let manualReviewCount: number | null = null;
    if (manualReviewCountValue && manualReviewCountValue.trim() !== "") {
      const parsed = parseInt(manualReviewCountValue.trim());
      if (!isNaN(parsed) && parsed >= 0) {
        manualReviewCount = parsed;
      }
    }
    
    // Debug log
    console.log('[ProductForm] Manual Rating:', manualRating);
    console.log('[ProductForm] Manual Review Count:', manualReviewCount);
    
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      brandId: formData.get("brandId") as string || null,
      categoryId: formData.get("categoryId") as string || null,
      genderId: formData.get("genderId") as string || null,
      isPublished: formData.get("isPublished") === "on",
      amazonUrl: formData.get("amazonUrl") as string || null,
      manualRating,
      manualReviewCount,
      metaTitle: (formData.get("metaTitle") as string)?.trim() || null,
      metaDescription: (formData.get("metaDescription") as string)?.trim() || null,
      metaKeywords: (formData.get("metaKeywords") as string)?.trim() || null,
    };

    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateProduct({ ...data, id: product.id });
        } else {
          // For new products, also need variant data
          const variant = {
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
          const imageUrl = formData.get("imageUrl") as string || null;
          await createProduct({ ...data, variant, imageUrl });
        }
        router.push("/admin/products");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-body text-red-800">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-xl border border-light-300 bg-white p-6">
        <h2 className="text-heading-3 text-dark-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-caption font-medium text-dark-900 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={product?.name}
              required
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-caption font-medium text-dark-900 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description}
              required
              rows={5}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="brandId" className="block text-caption font-medium text-dark-900">
                  Brand
                </label>
                <button
                  type="button"
                  onClick={() => setShowBrandForm(!showBrandForm)}
                  className="text-caption text-dark-700 hover:text-dark-900 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              {showBrandForm && (
                <div className="brand-form-container mb-2 space-y-2 rounded-lg border border-light-300 bg-light-50 p-2">
                  <div>
                    <input
                      type="text"
                      name="brandName"
                      placeholder="Brand name"
                      required
                      className="w-full rounded-lg border border-light-300 bg-white px-2 py-1 text-caption text-dark-900"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="brandLogoUrl"
                      placeholder="Logo URL (optional)"
                      className="w-full rounded-lg border border-light-300 bg-white px-2 py-1 text-caption text-dark-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddBrand}
                      className="flex-1 rounded-lg bg-dark-900 px-2 py-1 text-caption text-light-100"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBrandForm(false)}
                      className="rounded-lg border border-light-300 bg-white px-2 py-1 text-caption text-dark-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <select
                id="brandId"
                name="brandId"
                defaultValue={product?.brandId || ""}
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              >
                <option value="">Select Brand</option>
                {brandsList.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="categoryId" className="block text-caption font-medium text-dark-900">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  className="text-caption text-dark-700 hover:text-dark-900 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              {showCategoryForm && (
                <div className="category-form-container mb-2 space-y-2 rounded-lg border border-light-300 bg-light-50 p-2">
                  <div>
                    <input
                      type="text"
                      name="categoryName"
                      placeholder="Category name"
                      required
                      className="w-full rounded-lg border border-light-300 bg-white px-2 py-1 text-caption text-dark-900"
                    />
                  </div>
                  <div>
                    <select
                      name="categoryParentId"
                      className="w-full rounded-lg border border-light-300 bg-white px-2 py-1 text-caption text-dark-900"
                    >
                      <option value="">No parent (root)</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="flex-1 rounded-lg bg-dark-900 px-2 py-1 text-caption text-light-100"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="rounded-lg border border-light-300 bg-white px-2 py-1 text-caption text-dark-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={product?.categoryId || ""}
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              >
                <option value="">Select Category</option>
                {categoriesList.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="genderId" className="block text-caption font-medium text-dark-900 mb-1">
                Gender
              </label>
              <select
                id="genderId"
                name="genderId"
                defaultValue={product?.genderId || ""}
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              >
                <option value="">Select Gender</option>
                {genders.map((gender) => (
                  <option key={gender.id} value={gender.id}>
                    {gender.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="amazonUrl" className="block text-caption font-medium text-dark-900 mb-1">
              Amazon URL
            </label>
            <input
              type="url"
              id="amazonUrl"
              name="amazonUrl"
              defaultValue={product?.amazonUrl || ""}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="manualRating" className="block text-caption font-medium text-dark-900 mb-1">
                Manual Rating (0-5, e.g., 4.7)
              </label>
              <input
                type="number"
                id="manualRating"
                name="manualRating"
                step="0.1"
                min="0"
                max="5"
                defaultValue={product?.manualRating ? String(product.manualRating) : ""}
                placeholder="4.7"
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              />
              <p className="mt-1 text-footnote text-dark-700">Leave empty to use calculated rating from reviews</p>
            </div>
            <div>
              <label htmlFor="manualReviewCount" className="block text-caption font-medium text-dark-900 mb-1">
                Manual Review Count (e.g., 10000)
              </label>
              <input
                type="number"
                id="manualReviewCount"
                name="manualReviewCount"
                min="0"
                defaultValue={product?.manualReviewCount !== null && product?.manualReviewCount !== undefined ? String(product.manualReviewCount) : ""}
                placeholder="10000"
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              />
              <p className="mt-1 text-footnote text-dark-700">Leave empty to use actual review count from database</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              defaultChecked={product?.isPublished || false}
              className="h-4 w-4 rounded border-light-300 text-dark-900 focus:ring-2 focus:ring-dark-900/10"
            />
            <label htmlFor="isPublished" className="text-body text-dark-900">
              Publish immediately
            </label>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="rounded-xl border border-light-300 bg-white p-6">
        <h2 className="text-heading-3 text-dark-900 mb-4">SEO Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="metaTitle" className="block text-caption font-medium text-dark-900 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              id="metaTitle"
              name="metaTitle"
              defaultValue={product?.metaTitle || ""}
              maxLength={60}
              placeholder="SEO title (recommended: 50-60 characters)"
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
            <p className="mt-1 text-footnote text-dark-700">Leave empty to use product name</p>
          </div>

          <div>
            <label htmlFor="metaDescription" className="block text-caption font-medium text-dark-900 mb-1">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              defaultValue={product?.metaDescription || ""}
              rows={3}
              maxLength={160}
              placeholder="SEO description (recommended: 150-160 characters)"
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
            <p className="mt-1 text-footnote text-dark-700">Leave empty to use product description</p>
          </div>

          <div>
            <label htmlFor="metaKeywords" className="block text-caption font-medium text-dark-900 mb-1">
              Meta Keywords
            </label>
            <input
              type="text"
              id="metaKeywords"
              name="metaKeywords"
              defaultValue={product?.metaKeywords || ""}
              placeholder="Comma-separated keywords (e.g., sneakers, running shoes, athletic)"
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
            <p className="mt-1 text-footnote text-dark-700">Separate keywords with commas</p>
          </div>
        </div>
      </div>

      {/* First Variant - Only show in create mode */}
      {!isEditMode && (
        <div className="rounded-xl border border-light-300 bg-white p-6">
          <h2 className="text-heading-3 text-dark-900 mb-4">First Variant</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sku" className="block text-caption font-medium text-dark-900 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  required
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-caption font-medium text-dark-900 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="salePrice" className="block text-caption font-medium text-dark-900 mb-1">
                  Sale Price
                </label>
                <input
                  type="number"
                  id="salePrice"
                  name="salePrice"
                  step="0.01"
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
              <div>
                <label htmlFor="inStock" className="block text-caption font-medium text-dark-900 mb-1">
                  In Stock *
                </label>
                <input
                  type="number"
                  id="inStock"
                  name="inStock"
                  defaultValue="0"
                  min="0"
                  required
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="colorId" className="block text-caption font-medium text-dark-900 mb-1">
                  Color *
                </label>
                <select
                  id="colorId"
                  name="colorId"
                  required
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                >
                  <option value="">Select Color</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sizeId" className="block text-caption font-medium text-dark-900 mb-1">
                  Size *
                </label>
                <select
                  id="sizeId"
                  name="sizeId"
                  required
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                >
                  <option value="">Select Size</option>
                  {sizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label htmlFor="weight" className="block text-caption font-medium text-dark-900 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  step="0.01"
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
              <div>
                <label htmlFor="dimensionsLength" className="block text-caption font-medium text-dark-900 mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  id="dimensionsLength"
                  name="dimensionsLength"
                  step="0.01"
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
              <div>
                <label htmlFor="dimensionsWidth" className="block text-caption font-medium text-dark-900 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  id="dimensionsWidth"
                  name="dimensionsWidth"
                  step="0.01"
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
              <div>
                <label htmlFor="dimensionsHeight" className="block text-caption font-medium text-dark-900 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  id="dimensionsHeight"
                  name="dimensionsHeight"
                  step="0.01"
                  className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* First Image - Only show in create mode */}
      {!isEditMode && (
        <div className="rounded-xl border border-light-300 bg-white p-6">
          <h2 className="text-heading-3 text-dark-900 mb-4">Product Image</h2>
          <div>
            <label htmlFor="imageUrl" className="block text-caption font-medium text-dark-900 mb-1">
              Image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              placeholder="/images/product.jpg"
            />
            <p className="mt-1 text-caption text-dark-700">
              Enter a full URL or a relative path starting with /
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-light-300 bg-white px-6 py-2 text-body font-medium text-dark-900 transition-colors hover:bg-light-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-dark-900 px-6 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEditMode ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

