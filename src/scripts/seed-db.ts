import "dotenv/config"
import { db } from "../lib"
import { categories, brands, products, productImages, productVariants } from "../db/schema"
import { PRODUCTS as MOCK_PRODUCTS } from "../lib/products"
import { v5 as uuidv5 } from "uuid"

const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

function slugify(name: string): string {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, '-and-')         // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

const storeCategories = [
  { name: "Electronics", slug: "electronics", description: "Tech, gadgets, and accessories" },
  { name: "Apparel", slug: "apparel", description: "Clothing and garments" },
  { name: "Fashion", slug: "fashion", description: "Trending apparel and fashion accessories" },
  { name: "Kitchen", slug: "kitchen", description: "Cookware, tableware, and kitchen utensils" },
  { name: "Home and Furniture", slug: "home-and-furniture", description: "Furniture and home decor" },
  { name: "Beauty and Personal Care", slug: "beauty-and-personal-care", description: "Cosmetics, skincare, and grooming" },
  { name: "Sports and Outdoors", slug: "sports-and-outdoors", description: "Sports gear, outdoor equipment, and shoes" },
  { name: "Gym and Fitness", slug: "gym-and-fitness", description: "Exercise machines, weights, and accessories" },
  { name: "Books and Stationery", slug: "books-and-stationery", description: "Novels, textbooks, and office supplies" },
  { name: "Video Games", slug: "video-games", description: "Consoles, video games, and gaming gear" },
]

const storeBrands = [
  { name: "Sony", slug: "sony" },
  { name: "PlayStation", slug: "playstation" },
  { name: "Generic", slug: "generic" },
  { name: "Nike", slug: "nike" },
  { name: "Samsung", slug: "samsung" },
  { name: "KitchenCraft", slug: "kitchencraft" },
  { name: "FitPro", slug: "fitpro" },
]

function getBrandName(productName: string): string {
  if (productName.toLowerCase().includes("sony")) return "Sony";
  if (productName.toLowerCase().includes("playstation") || productName.toLowerCase().includes("dualsense")) return "PlayStation";
  if (productName.toLowerCase().includes("shoes") || productName.toLowerCase().includes("running")) return "Nike";
  if (productName.toLowerCase().includes("cookware") || productName.toLowerCase().includes("stainless steel")) return "KitchenCraft";
  if (productName.toLowerCase().includes("dumbbell") || productName.toLowerCase().includes("fitness")) return "FitPro";
  return "Generic";
}

async function main() {
  console.log("Starting Neon PostgreSQL database seeding...")

  try {
    // 1. Clean old data in safe sequence (due to foreign key constraints)
    console.log("Cleaning database tables...")
    await db.delete(productImages)
    await db.delete(productVariants)
    await db.delete(products)
    await db.delete(brands)
    await db.delete(categories)

    // 2. Seed Categories
    console.log("Inserting categories...")
    const categoryMap = new Map<string, string>();
    for (const cat of storeCategories) {
      const id = uuidv5(`cat-${cat.slug}`, UUID_NAMESPACE)
      await db.insert(categories).values({
        id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
      })
      categoryMap.set(cat.name.toLowerCase(), id);
      console.log(`Seeded Category: ${cat.name}`)
    }

    // 3. Seed Brands
    console.log("Inserting brands...")
    const brandMap = new Map<string, string>();
    for (const brd of storeBrands) {
      const id = uuidv5(`brand-${brd.slug}`, UUID_NAMESPACE)
      await db.insert(brands).values({
        id,
        name: brd.name,
        slug: brd.slug,
        isActive: true,
      })
      brandMap.set(brd.name.toLowerCase(), id);
      console.log(`Seeded Brand: ${brd.name}`)
    }

    // 4. Seed Products, Images, and Variants from Mock Products
    console.log("Inserting products, images, and variants...")
    for (const mockProd of MOCK_PRODUCTS) {
      const prodSlug = slugify(mockProd.name)
      const productId = uuidv5(`prod-${prodSlug}`, UUID_NAMESPACE)

      // Match Category
      const catKey = mockProd.category.toLowerCase();
      let categoryId = categoryMap.get(catKey);
      if (!categoryId) {
        // Fallback or dynamically create category
        const catSlug = slugify(mockProd.category);
        categoryId = uuidv5(`cat-${catSlug}`, UUID_NAMESPACE)
        await db.insert(categories).values({
          id: categoryId,
          name: mockProd.category,
          slug: catSlug,
          description: `${mockProd.category} category`,
          isActive: true,
        })
        categoryMap.set(catKey, categoryId);
        console.log(`Dynamically Created Category: ${mockProd.category}`)
      }

      // Match Brand
      const brandName = getBrandName(mockProd.name);
      const brandKey = brandName.toLowerCase();
      let brandId = brandMap.get(brandKey);
      if (!brandId) {
        const brandSlug = slugify(brandName);
        brandId = uuidv5(`brand-${brandSlug}`, UUID_NAMESPACE)
        await db.insert(brands).values({
          id: brandId,
          name: brandName,
          slug: brandSlug,
          isActive: true,
        })
        brandMap.set(brandKey, brandId);
        console.log(`Dynamically Created Brand: ${brandName}`)
      }

      // Insert Product
      await db.insert(products).values({
        id: productId,
        categoryId: categoryId,
        brandId: brandId,
        name: mockProd.name,
        slug: prodSlug,
        description: mockProd.description,
        status: "PUBLISHED" as const,
        isFeatured: mockProd.badge === "Best Seller" || mockProd.badge === "Top Rated" || mockProd.badge === "Hot Deal",
        isNewArrival: mockProd.badge === "New",
      })
      console.log(`Seeded Product: ${mockProd.name}`)

      // Insert Images
      if (mockProd.images && mockProd.images.length > 0) {
        for (let i = 0; i < mockProd.images.length; i++) {
          const imgUrl = mockProd.images[i];
          await db.insert(productImages).values({
            productId: productId,
            imageUrl: imgUrl,
            sortOrder: i,
          })
        }
        console.log(`  Seeded ${mockProd.images.length} images for product`)
      }

      // Insert Default Variant
      await db.insert(productVariants).values({
        productId: productId,
        sku: `SKU-${prodSlug.substring(0, 30).toUpperCase()}-DEFAULT`,
        price: mockProd.price,
        compareAtPrice: mockProd.originalPrice,
        stock: mockProd.inStock ? 100 : 0,
        isActive: true,
      })
      console.log(`  Seeded default variant for product`)
    }

    console.log("Database seeded successfully with Categories, Brands, Products, Images, and Variants!")
    process.exit(0)
  } catch (err) {
    console.error("Seeding failed with error:", err)
    process.exit(1)
  }
}

main()
