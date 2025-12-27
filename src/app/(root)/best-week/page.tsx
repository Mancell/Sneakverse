import { Card } from "@/components";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { getAllProducts } from "@/lib/actions/product";
import { parseFilterParams } from "@/lib/utils/query";

export default async function BestWeekPage() {
  try {
    // Get best selling/most popular products (sorted by most_popular)
    const { products } = await getAllProducts({
      search: undefined,
      genderSlugs: [],
      brandSlugs: [],
      categorySlugs: [],
      sizeSlugs: [],
      colorSlugs: [],
      priceMin: undefined,
      priceMax: undefined,
      priceRanges: [],
      sort: "most_popular",
      page: 1,
      limit: 20, // Show more products for Best Week
    });

    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="mb-4">
            <AnimatedText 
              text="Best Week" 
              textClassName="text-heading-2 text-dark-900 text-left"
              className="items-start"
            />
          </div>
          <p className="text-body text-dark-700">
            Discover this week&apos;s most popular and trending products
          </p>
        </header>

        {products.length === 0 ? (
          <div className="rounded-lg border border-light-300 bg-light-100 p-12 text-center">
            <p className="text-body-medium text-dark-900 mb-2">No products found</p>
            <p className="text-body text-dark-700">Products will appear here once they are added to the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => {
              const price = p.minPrice !== null && p.maxPrice !== null && p.minPrice !== p.maxPrice
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
      </main>
    );
  } catch (error) {
    console.error("[BestWeekPage] Error:", error);
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="py-16 text-center">
          <div className="mb-4">
            <AnimatedText 
              text="Error Loading Products" 
              textClassName="text-heading-2 text-dark-900 text-center"
              className="items-center"
            />
          </div>
          <p className="text-body text-dark-700">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </main>
    );
  }
}

