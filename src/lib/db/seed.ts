import { db } from '@/lib/db';
import {
  genders, colors, sizes, brands, categories, collections, productCollections,
  products, productVariants, productImages, brandCategories,
  insertGenderSchema, insertColorSchema, insertSizeSchema, insertBrandSchema,
  insertCategorySchema, insertCollectionSchema, insertProductSchema, insertVariantSchema, insertProductImageSchema,
  type InsertProduct, type InsertVariant, type InsertProductImage,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { mkdirSync, existsSync, cpSync } from 'fs';
import { join, basename } from 'path';
import { assignCategoryForProduct } from '@/lib/utils/category-assignment';
type ProductRow = typeof products.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;

type RGBHex = `#${string}`;

const log = (...args: unknown[]) => console.log('[seed]', ...args);
const err = (...args: unknown[]) => console.error('[seed:error]', ...args);

function pick<T>(arr: T[], n: number) {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  try {
    log('Seeding filters: genders, colors, sizes');

    const genderRows = [
      insertGenderSchema.parse({ label: 'Men', slug: 'men' }),
      insertGenderSchema.parse({ label: 'Women', slug: 'women' }),
      insertGenderSchema.parse({ label: 'Unisex', slug: 'unisex' }),
    ];
    for (const row of genderRows) {
      const exists = await db.select().from(genders).where(eq(genders.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(genders).values(row);
    }

    const colorRows = [
      { name: 'Black', slug: 'black', hexCode: '#000000' as RGBHex },
      { name: 'White', slug: 'white', hexCode: '#FFFFFF' as RGBHex },
      { name: 'Red', slug: 'red', hexCode: '#FF0000' as RGBHex },
      { name: 'Blue', slug: 'blue', hexCode: '#1E3A8A' as RGBHex },
      { name: 'Green', slug: 'green', hexCode: '#10B981' as RGBHex },
      { name: 'Gray', slug: 'gray', hexCode: '#6B7280' as RGBHex },
    ].map((c) => insertColorSchema.parse(c));
    for (const row of colorRows) {
      const exists = await db.select().from(colors).where(eq(colors.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(colors).values(row);
    }

    const sizeRows = [
      { name: '7', slug: '7', sortOrder: 0 },
      { name: '8', slug: '8', sortOrder: 1 },
      { name: '9', slug: '9', sortOrder: 2 },
      { name: '10', slug: '10', sortOrder: 3 },
      { name: '11', slug: '11', sortOrder: 4 },
      { name: '12', slug: '12', sortOrder: 5 },
    ].map((s) => insertSizeSchema.parse(s));
    for (const row of sizeRows) {
      const exists = await db.select().from(sizes).where(eq(sizes.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(sizes).values(row);
    }

    log('Seeding brands');
    const brandList = [
      'PUMA',
      'adidas',
      'Under Armour',
      'Skechers',
      'CAMPER',
      'Calvin Klein',
      'Tommy Hilfiger',
      'Tommy Jeans',
      'Slazenger',
      'Superga',
      'Red Tape',
      'Reebok',
      'Ducavelli',
      'DeFacto',
      'MUGGO',
      'lumberjack',
      'JUMP',
      'New Balance',
      'Salomon',
      'Columbia',
      'Lotto',
      'Vans',
      'Nike',
      'Hummel',
      'ASICS',
      'INCI',
      'Crocs',
      'Dockers by Gerli',
      'United Colors of Benetton',
      'Jack Wolfskin',
      'MERRELL',
      'The North Face',
      'GÖNDERİR',
      'PEAK',
      'LETAO',
      'Tonny Black',
      'JACK & JONES',
      'Kappa',
      'On',
      'Scooter',
    ];
    
    let addedBrands = 0;
    for (const brandName of brandList) {
      const slug = brandName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
      const brand = insertBrandSchema.parse({ name: brandName, slug, logoUrl: undefined });
      const exists = await db.select().from(brands).where(eq(brands.slug, brand.slug)).limit(1);
      if (!exists.length) {
        await db.insert(brands).values(brand);
        addedBrands++;
      }
    }
    log(`Brands seeding complete. Added ${addedBrands} new brands, ${brandList.length - addedBrands} already existed.`);

    log('Seeding categories');
    const catRows = [
      // Women's categories
      { name: 'Closed Toe Slippers', slug: 'closed-toe-slippers', parentId: null },
      { name: 'Boots', slug: 'boots', parentId: null },
      { name: 'Flat Shoes', slug: 'flat-shoes', parentId: null },
      { name: 'House Slippers', slug: 'house-slippers', parentId: null },
      { name: 'Sandals and Slippers', slug: 'sandals-and-slippers', parentId: null },
      { name: 'Sneakers', slug: 'sneakers', parentId: null },
      { name: 'Sports and Outdoor Shoes', slug: 'sports-and-outdoor-shoes', parentId: null },
      { name: 'Heeled Shoes', slug: 'heeled-shoes', parentId: null },
      // Men's categories
      { name: 'Lace-up Shoes', slug: 'lace-up-shoes', parentId: null },
      { name: 'Espadrilles', slug: 'espadrilles', parentId: null },
      { name: 'Flip Flops', slug: 'flip-flops', parentId: null },
      { name: 'Sabots and Slippers', slug: 'sabots-and-slippers', parentId: null },
      { name: 'Sandals', slug: 'sandals', parentId: null },
      { name: 'Boat Shoes', slug: 'boat-shoes', parentId: null },
    ].map((c) => insertCategorySchema.parse(c));
    let addedCount = 0;
    for (const row of catRows) {
      const exists = await db.select().from(categories).where(eq(categories.slug, row.slug)).limit(1);
      if (!exists.length) {
        await db.insert(categories).values(row);
        addedCount++;
        log(`Added category: ${row.name}`);
      }
    }
    log(`Categories seeding complete. Added ${addedCount} new categories, ${catRows.length - addedCount} already existed.`);

    log('Seeding collections');
    const collectionRows = [
      insertCollectionSchema.parse({ name: "Summer '25", slug: 'summer-25' }),
      insertCollectionSchema.parse({ name: 'New Arrivals', slug: 'new-arrivals' }),
    ];
    for (const row of collectionRows) {
      const exists = await db.select().from(collections).where(eq(collections.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(collections).values(row);
    }

    const allGenders = await db.select().from(genders);
    const allColors = await db.select().from(colors);
    const allSizes = await db.select().from(sizes);
    const allBrandsList = await db.select().from(brands);
    
    // Get all new categories
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(c => [c.slug, c]));
    
    // Women's categories
    const womenCategories = [
      'closed-toe-slippers',
      'boots',
      'flat-shoes',
      'house-slippers',
      'sandals-and-slippers',
      'sneakers',
      'sports-and-outdoor-shoes',
      'heeled-shoes',
    ].map(slug => categoryMap.get(slug)).filter(Boolean);
    
    // Men's categories
    const menCategories = [
      'lace-up-shoes',
      'boots',
      'flat-shoes',
      'espadrilles',
      'house-slippers',
      'flip-flops',
      'sabots-and-slippers',
      'sandals',
      'sneakers',
      'sports-and-outdoor-shoes',
      'boat-shoes',
    ].map(slug => categoryMap.get(slug)).filter(Boolean);
    
    // Unisex categories (common ones)
    const unisexCategories = [
      'boots',
      'flat-shoes',
      'house-slippers',
      'sneakers',
      'sports-and-outdoor-shoes',
    ].map(slug => categoryMap.get(slug)).filter(Boolean);
    
    const summer = (await db.select().from(collections).where(eq(collections.slug, 'summer-25')))[0];
    const newArrivals = (await db.select().from(collections).where(eq(collections.slug, 'new-arrivals')))[0];

    const uploadsRoot = join(process.cwd(), 'static', 'uploads', 'shoes');
    if (!existsSync(uploadsRoot)) {
      mkdirSync(uploadsRoot, { recursive: true });
    }

    const sourceDir = join(process.cwd(), 'public', 'shoes');
    
    // Product name templates by brand
    const brandProductTemplates: Record<string, string[]> = {
      'nike': ['Air Max', 'Air Force', 'Dunk', 'React', 'Zoom'],
      'adidas': ['Ultraboost', 'Stan Smith', 'Superstar', 'Yeezy', 'NMD'],
      'puma': ['Suede Classic', 'RS-X', 'Clyde', 'Thunder', 'Future'],
      'new-balance': ['574', '990', '550', '327', '2002R'],
      'reebok': ['Classic Leather', 'Club C', 'Instapump', 'Question', 'Answer'],
      'asics': ['Gel-Kayano', 'Gel-Nimbus', 'GT-2000', 'Gel-Lyte', 'Metaspeed'],
      'under-armour': ['HOVR', 'Charged', 'Curry', 'Project Rock', 'Speedform'],
      'skechers': ['D\'Lites', 'Go Walk', 'Relaxed Fit', 'Memory Foam', 'Arch Fit'],
      'vans': ['Old Skool', 'Authentic', 'Sk8-Hi', 'Era', 'Slip-On'],
      'tommy-hilfiger': ['Classic', 'Sport', 'Premium', 'Heritage', 'Signature'],
      'tommy-jeans': ['Retro', 'Vintage', 'Street', 'Classic', 'Modern'],
      'calvin-klein': ['Minimalist', 'Classic', 'Modern', 'Essential', 'Signature'],
      'jack-jones': ['Urban', 'Classic', 'Premium', 'Essential', 'Modern'],
      'kappa': ['Sport', 'Classic', 'Retro', 'Modern', 'Heritage'],
      'crocs': ['Classic Clog', 'Literide', 'Bistro', 'Crocsband', 'Swiftwater'],
      'camper': ['Peu', 'Pelotas', 'Right', 'Twins', 'Camaleon'],
      'superga': ['2750', '2790', 'Classic', 'CotU', 'Platform'],
      'slazenger': ['Heritage', 'Classic', 'Sport', 'Premium', 'Modern'],
      'red-tape': ['Classic', 'Sport', 'Premium', 'Heritage', 'Modern'],
      'ducavelli': ['Classic', 'Premium', 'Heritage', 'Modern', 'Sport'],
      'defacto': ['Essential', 'Classic', 'Modern', 'Premium', 'Sport'],
      'muggo': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
      'lumberjack': ['Outdoor', 'Work', 'Classic', 'Premium', 'Heritage'],
      'jump': ['Sport', 'Classic', 'Modern', 'Premium', 'Essential'],
      'salomon': ['Speedcross', 'XT-6', 'XA Pro', 'Quest', 'Sense'],
      'columbia': ['Bugaboot', 'Trail', 'Outdry', 'Sport', 'Classic'],
      'merrell': ['Moab', 'Trail', 'Jungle', 'Vapor', 'Accent'],
      'the-north-face': ['Vectiv', 'Trail', 'Ultra', 'Endurance', 'Flight'],
      'jack-wolfskin': ['Texapore', 'Trail', 'Outdoor', 'Premium', 'Classic'],
      'hummel': ['Classic', 'Sport', 'Heritage', 'Modern', 'Premium'],
      'lotto': ['Stadio', 'Primo', 'Classic', 'Sport', 'Modern'],
      'peak': ['Flash', 'Classic', 'Sport', 'Modern', 'Premium'],
      'on': ['Cloud', 'Cloudrunner', 'Cloudflow', 'Cloudstratus', 'Cloudflyer'],
      'inci': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
      'dockers-by-gerli': ['Classic', 'Premium', 'Heritage', 'Modern', 'Essential'],
      'united-colors-of-benetton': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
      'gönderir': ['Classic', 'Sport', 'Modern', 'Premium', 'Heritage'],
      'letao': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
      'tonny-black': ['Classic', 'Premium', 'Modern', 'Heritage', 'Sport'],
      'scooter': ['Classic', 'Modern', 'Sport', 'Premium', 'Essential'],
    };
    
    // Generate product names based on brands (15 products)
    const productNames: string[] = [];

    const sourceImages = [
      'shoe-1.jpg','shoe-2.webp','shoe-3.webp','shoe-4.webp','shoe-5.avif',
      'shoe-6.avif','shoe-7.avif','shoe-8.avif','shoe-9.avif','shoe-10.avif',
      'shoe-11.avif','shoe-12.avif','shoe-13.avif','shoe-14.avif','shoe-15.avif',
    ];

    // Get brand-category relationships
    const brandCategoryRelations = await db.select().from(brandCategories);
    const brandCategoryMap = new Map<string, typeof allCategories>();
    for (const relation of brandCategoryRelations) {
      const brand = allBrandsList.find(b => b.id === relation.brandId);
      const category = allCategories.find(c => c.id === relation.categoryId);
      if (brand && category) {
        if (!brandCategoryMap.has(brand.slug)) {
          brandCategoryMap.set(brand.slug, []);
        }
        brandCategoryMap.get(brand.slug)!.push(category);
      }
    }

    // Generate product names based on brands
    for (let i = 0; i < 15; i++) {
      const randomBrand = allBrandsList[randInt(0, allBrandsList.length - 1)];
      const templates = brandProductTemplates[randomBrand.slug] || ['Classic', 'Premium', 'Sport', 'Modern', 'Essential'];
      const template = templates[randInt(0, templates.length - 1)];
      productNames.push(`${randomBrand.name} ${template}`);
    }

    log('Creating products with variants and images');
    for (let i = 0; i < productNames.length; i++) {
      const fullName = productNames[i];
      const gender = allGenders[randInt(0, allGenders.length - 1)];
      
      // Extract brand from product name (first word is brand name)
      const brandName = fullName.split(' ')[0];
      const brand = allBrandsList.find(b => b.name === brandName) || 
                   allBrandsList[randInt(0, allBrandsList.length - 1)];
      
      // Use helper function to assign category based on gender and brand
      const catPick = assignCategoryForProduct(
        gender.slug,
        brand.slug,
        allCategories,
        brandCategoryMap
      );
      
      if (!catPick) {
        log(`Warning: No category found for product ${fullName} with gender ${gender.slug} and brand ${brand.name}`);
      } else {
        log(`Assigned category ${catPick.name} to product ${fullName} (${gender.slug}, ${brand.name})`);
      }
      
      const desc = `Experience comfort and performance with ${fullName}.`;

      // Generate a sample Amazon URL (users can update with real URLs later)
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(name)}&ref=sr_pg_1`;
      
      const product = insertProductSchema.parse({
        name: fullName,
        description: desc,
        categoryId: catPick?.id ?? null,
        genderId: gender?.id ?? null,
        brandId: brand?.id ?? null,
        isPublished: true,
        amazonUrl,
      });

      const retP = await db.insert(products).values(product as InsertProduct).returning();
      const insertedProduct = (retP as ProductRow[])[0];
      const colorChoices = pick(allColors, randInt(2, Math.min(4, allColors.length)));
      const sizeChoices = pick(allSizes, randInt(3, Math.min(6, allSizes.length)));

      const variantIds: string[] = [];
      let defaultVariantId: string | null = null;

      for (const color of colorChoices) {
        for (const size of sizeChoices) {
          const priceNum = Number((randInt(80, 200) + 0.99).toFixed(2));
          const discountedNum = Math.random() < 0.3 ? Number((priceNum - randInt(5, 25)).toFixed(2)) : null;
          const sku = `NIKE-${insertedProduct.id.slice(0, 8)}-${color.slug.toUpperCase()}-${size.slug.toUpperCase()}`;
          const variant = insertVariantSchema.parse({
            productId: insertedProduct.id,
            sku,
            price: priceNum.toFixed(2),
            salePrice: discountedNum !== null ? discountedNum.toFixed(2) : undefined,
            colorId: color.id,
            sizeId: size.id,
            inStock: randInt(5, 50),
            weight: Number((Math.random() * 1 + 0.5).toFixed(2)),
            dimensions: { length: 30, width: 20, height: 12 },
          });
          const retV = await db.insert(productVariants).values(variant as InsertVariant).returning();
          const created = (retV as VariantRow[])[0];
          variantIds.push(created.id);
          if (!defaultVariantId) defaultVariantId = created.id;

          // Add variant-specific images for some variants (about 30% chance)
          if (Math.random() < 0.3 && colorChoices.indexOf(color) === 0) {
            try {
              const variantImgName = sourceImages[(i + colorChoices.indexOf(color)) % sourceImages.length];
              const variantSrc = join(sourceDir, variantImgName);
              const variantDestName = `${created.id}-${basename(variantImgName)}`;
              const variantDest = join(uploadsRoot, variantDestName);
              cpSync(variantSrc, variantDest);
              const variantImg: InsertProductImage = insertProductImageSchema.parse({
                productId: insertedProduct.id,
                variantId: created.id,
                url: `/static/uploads/shoes/${variantDestName}`,
                sortOrder: 1,
                isPrimary: false,
              });
              await db.insert(productImages).values(variantImg);
            } catch (e) {
              err('Failed to copy variant image', { e });
            }
          }
        }
      }

      if (defaultVariantId) {
        await db.update(products).set({ defaultVariantId }).where(eq(products.id, insertedProduct.id));
      }

      const pickName = sourceImages[i % sourceImages.length];
      const src = join(sourceDir, pickName);
      const destName = `${insertedProduct.id}-${basename(pickName)}`;
      const dest = join(uploadsRoot, destName);
      try {
        cpSync(src, dest);
        const img: InsertProductImage = insertProductImageSchema.parse({
          productId: insertedProduct.id,
          url: `/static/uploads/shoes/${destName}`,
          sortOrder: 0,
          isPrimary: true,
        });
        await db.insert(productImages).values(img);
      } catch (e) {
        err('Failed to copy product image', { src, dest, e });
      }

      const collectionsForProduct: { id: string }[] = Math.random() < 0.5 ? [summer] : ([newArrivals, summer].filter(Boolean) as { id: string }[]);
      for (const col of collectionsForProduct) {
        await db.insert(productCollections).values({
          productId: insertedProduct.id,
          collectionId: col.id,
        });
      }

      log(`Seeded product ${name} with ${variantIds.length} variants`);
    }

    log('Seeding complete');
  } catch (e) {
    err(e);
    process.exitCode = 1;
  }
}

seed();
