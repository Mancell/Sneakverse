import { Card } from "@/components";
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { parseFilterParams } from "@/lib/utils/query";
import { getAllProducts, getAllBrands, getAllCategories } from "@/lib/actions/product";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const sp = await searchParams;

    const parsed = parseFilterParams(sp);
    
    // Get selected gender slugs for category filtering
    const selectedGenderSlugs = parsed.genderSlugs.length > 0 ? parsed.genderSlugs : undefined;
    
    const [{ products, totalCount }, brands, categories] = await Promise.all([
      getAllProducts(parsed),
      getAllBrands(),
      getAllCategories(selectedGenderSlugs),
    ]);
    
    console.log("[ProductsPage] Selected genders:", selectedGenderSlugs, "Categories:", categories.length, categories.map(c => c.name));

    const activeBadges: string[] = [];
    (sp.gender ? (Array.isArray(sp.gender) ? sp.gender : [sp.gender]) : []).forEach((g) =>
      activeBadges.push(String(g)[0].toUpperCase() + String(g).slice(1))
    );
    (sp.brand ? (Array.isArray(sp.brand) ? sp.brand : [sp.brand]) : []).forEach((b) => {
      const brand = brands.find(br => br.slug === String(b));
      activeBadges.push(brand ? brand.name : String(b));
    });
    (sp.category ? (Array.isArray(sp.category) ? sp.category : [sp.category]) : []).forEach((cat) => {
      const category = categories.find(c => c.slug === String(cat));
      activeBadges.push(category ? category.name : String(cat));
    });
    (sp.color ? (Array.isArray(sp.color) ? sp.color : [sp.color]) : []).forEach((c) =>
      activeBadges.push(String(c)[0].toUpperCase() + String(c).slice(1))
    );
    (sp.price ? (Array.isArray(sp.price) ? sp.price : [sp.price]) : []).forEach((p) => {
      const priceStr = String(p);
      const [min, max] = priceStr.split("-");
      const label = min && max ? `$${min} - $${max}` : min && !max && priceStr.endsWith("-") ? `Over $${min}` : `$0 - $${max}`;
      activeBadges.push(label);
    });

    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AnimatedText 
            text={`Products (${totalCount})`}
            textClassName="text-heading-3 text-dark-900 text-left"
            className="items-start"
          />
        </div>
        <Sort />
      </header>

      {activeBadges.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {activeBadges.map((b, i) => (
            <span
              key={`${b}-${i}`}
              className="rounded-full border border-light-300 bg-light-100 px-3 py-1 text-caption text-dark-900"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <Filters brands={brands} categories={categories} />
        <div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-light-300 bg-light-100 p-12 text-center">
              <p className="text-body-medium text-dark-900 mb-2">No products found</p>
              <p className="text-body text-dark-700">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-6">
              {products.map((p) => {
                const price =
                  p.minPrice !== null && p.maxPrice !== null && p.minPrice !== p.maxPrice
                    ? `$${p.minPrice.toFixed(2)} - $${p.maxPrice.toFixed(2)}`
                    : p.minPrice !== null
                    ? `$${p.minPrice.toFixed(2)}`
                    : undefined;
                return (
                  <Card
                    key={p.id}
                    title={p.name}
                    subtitle={p.subtitle ?? undefined}
                    imageSrc={p.imageUrl ?? "/shoes/shoe-1.jpg"}
                    price={price}
                    href={`/products/${p.id}`}
                    brandName={p.brandName ?? undefined}
                    brandLogoUrl={p.brandLogoUrl ?? undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
      </main>
    );
  } catch (error) {
    console.error("[ProductsPage] Error:", error);
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16 text-center">
          <h1 className="mb-4 text-heading-2 text-dark-900">Error Loading Products</h1>
          <p className="text-body text-dark-700">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </main>
    );
  }
}
