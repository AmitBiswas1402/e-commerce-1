import { NextResponse } from "next/server"
import { db } from "@/lib"
import { wishlists, wishlistItems, products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { errorMessage, getCurrentDbUser } from "@/lib/authorization"

// Helper to get or create wishlist for a Clerk user
async function getOrCreateWishlist(userId: string) {
  // 1. Get database user UUID
  // 2. Get or create wishlist row
  const wishlistRows = await db.select().from(wishlists).where(eq(wishlists.userId, userId)).limit(1)
  if (wishlistRows.length > 0) {
    return wishlistRows[0]
  }

  const newWishlists = await db.insert(wishlists).values({ userId }).returning()
  return newWishlists[0]
}

// GET /api/wishlist - Get the authenticated user's wishlist items
export async function GET() {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    const wishlist = await getOrCreateWishlist(current.id)

    // Query wishlist items joined with products
    const items = await db
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
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(eq(wishlistItems.wishlistId, wishlist.id))

    // Map rows to Product format
    const mappedProducts = await Promise.all(
      items.map(async (row) => {
        const dbImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, row.id))
          .orderBy(productImages.sortOrder)

        const dbVariants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, row.id))

        const price = dbVariants[0]?.price || 0
        const originalPrice = dbVariants[0]?.compareAtPrice || price
        const inStock = dbVariants.some((v) => v.stock > 0 && v.isActive)

        return {
          id: row.id,
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
    console.error("GET /api/wishlist error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to fetch wishlist") }, { status: 500 })
  }
}

// POST /api/wishlist - Add or remove wishlist item
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { productId, action } = body as { productId?: string; action?: string }

    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const wishlist = await getOrCreateWishlist(current.id)

    // Handle remove action via POST
    if (action === "remove" || action === "delete") {
      await db
        .delete(wishlistItems)
        .where(
          and(
            eq(wishlistItems.wishlistId, wishlist.id),
            eq(wishlistItems.productId, productId)
          )
        )
      return NextResponse.json({ success: true, removed: true })
    }

    // Default: Add to wishlist
    await db
      .insert(wishlistItems)
      .values({
        wishlistId: wishlist.id,
        productId,
      })
      .onConflictDoNothing() // Prevent double-inserting if it's already there

    return NextResponse.json({ success: true, added: true })
  } catch (error) {
    console.error("POST /api/wishlist error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to update wishlist") }, { status: 500 })
  }
}

// DELETE /api/wishlist - Remove wishlist item
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")

    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const wishlist = await getOrCreateWishlist(current.id)

    await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.wishlistId, wishlist.id),
          eq(wishlistItems.productId, productId)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/wishlist error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to update wishlist") }, { status: 500 })
  }
}
