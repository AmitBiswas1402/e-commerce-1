import { db } from "@/lib"
import { products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { PRODUCTS as MOCK_PRODUCTS, type Product } from "./products"
import { slugify } from "./slug"

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const row = await db
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
      .where(eq(products.slug, slug))
      .limit(1)

    if (row.length === 0) {
      return MOCK_PRODUCTS.find((p) => slugify(p.name) === slug)
    }

    const item = row[0]
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

    return {
      id: item.id as any,
      name: item.name,
      description: item.description || "",
      category: item.categoryName || "",
      price: price,
      originalPrice: originalPrice,
      rating: 4.5,
      reviewCount: 12,
      images: dbImages.length > 0 ? dbImages.map((img) => img.imageUrl) : ["/placeholder.jpg"],
      reviews: [],
      inStock: inStock,
    }
  } catch (error) {
    console.error("getProductBySlug Drizzle error:", error)
    return MOCK_PRODUCTS.find((p) => slugify(p.name) === slug)
  }
}
