import { db } from "@/lib"
import { products, categories, brands, productImages, productVariants, reviews } from "@/db/schema"
import { eq, avg, count } from "drizzle-orm"
import { type Product } from "./products"
import { slugify } from "./slug"

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const rawSlug = slug
    const decodedSlug = decodeURIComponent(slug).trim()
    const cleanSlug = slugify(decodedSlug)

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        status: products.status,
        isFeatured: products.isFeatured,
        isNewArrival: products.isNewArrival,
        categoryName: categories.name,
        brandName: brands.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))

    // Match by exact slug, clean slugified title, raw ID, or decoded name
    const item = rows.find(
      (r) =>
        r.slug === rawSlug ||
        r.slug === cleanSlug ||
        r.id === rawSlug ||
        r.id === cleanSlug ||
        slugify(r.name) === cleanSlug ||
        r.name.toLowerCase() === decodedSlug.toLowerCase()
    )

    if (!item) {
      return undefined
    }

    const dbImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, item.id))
      .orderBy(productImages.sortOrder)

    const dbVariants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, item.id))

    const price = dbVariants[0]?.price || 0
    const originalPrice = dbVariants[0]?.compareAtPrice || price
    const inStock = dbVariants.some((v) => v.stock > 0 && v.isActive)

    // Real review averages from the reviews table
    let rating = 0
    let reviewCount = 0
    try {
      const agg = await db
        .select({ average: avg(reviews.rating), total: count() })
        .from(reviews)
        .where(eq(reviews.productId, item.id))
        .limit(1)
      rating = Number(agg[0]?.average || 0)
      reviewCount = Number(agg[0]?.total || 0)
    } catch (reviewErr) {
      console.warn("Failed to load reviews for product:", reviewErr)
    }

    return {
      id: item.id as any,
      name: item.name,
      description: item.description || "",
      category: item.categoryName || "",
      price: price,
      originalPrice: originalPrice,
      rating: rating > 0 ? Number(rating.toFixed(1)) : 0,
      reviewCount: reviewCount,
      images: dbImages.length > 0 ? dbImages.map((img) => img.imageUrl) : ["/placeholder.jpg"],
      reviews: [],
      inStock: inStock,
    }
  } catch (error) {
    console.error("getProductBySlug Drizzle error:", error)
    return undefined
  }
}
