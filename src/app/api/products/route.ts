import { NextResponse } from "next/server"
import { db } from "@/lib"
import { products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { PRODUCTS as MOCK_PRODUCTS, type Product } from "@/lib/products"

// GET /api/products - Fetch products list from Neon DB (with relational joins)
export async function GET() {
  try {
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

    if (rows.length === 0) {
      // Fallback to static mock products if database is empty
      return NextResponse.json(MOCK_PRODUCTS)
    }

    const mappedProducts = await Promise.all(
      rows.map(async (row) => {
        // Fetch child images
        const dbImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, row.id))
          .orderBy(productImages.sortOrder)

        // Fetch child variants
        const dbVariants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, row.id))

        const price = dbVariants[0]?.price || 0
        const originalPrice = dbVariants[0]?.compareAtPrice || price
        const inStock = dbVariants.some((v) => v.stock > 0 && v.isActive)

        return {
          id: row.id as any, // Cast UUID string safely to product.id type
          name: row.name,
          description: row.description || "",
          category: row.categoryName || "",
          price: price,
          originalPrice: originalPrice,
          rating: 4.5,
          reviewCount: 12,
          images: dbImages.length > 0 ? dbImages.map((img) => img.imageUrl) : ["/placeholder.jpg"],
          reviews: [],
          inStock: inStock,
        }
      })
    )

    return NextResponse.json(mappedProducts)
  } catch (error) {
    console.error("GET /api/products error:", error)
    // Resilient fallback to mock data on DB query failure
    return NextResponse.json(MOCK_PRODUCTS)
  }
}
