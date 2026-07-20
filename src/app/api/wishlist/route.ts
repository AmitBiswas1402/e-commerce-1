import { NextResponse } from "next/server"
import { db } from "@/lib"
import { users, wishlists, wishlistItems, products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// Helper to get or create wishlist for a Clerk user
async function getOrCreateWishlist(clerkId: string) {
  // 1. Get database user UUID
  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (userRows.length === 0) {
    throw new Error(`User not found with clerkId: ${clerkId}`)
  }
  const dbUserId = userRows[0].id

  // 2. Get or create wishlist row
  const wishlistRows = await db.select().from(wishlists).where(eq(wishlists.userId, dbUserId)).limit(1)
  if (wishlistRows.length > 0) {
    return wishlistRows[0]
  }

  const newWishlists = await db.insert(wishlists).values({ userId: dbUserId }).returning()
  return newWishlists[0]
}

// GET /api/wishlist?clerkId=XXX - Get user's wishlist items
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkId = searchParams.get("clerkId")

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId parameter" }, { status: 400 })
    }

    const wishlist = await getOrCreateWishlist(clerkId)

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
          id: row.id as any,
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
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/wishlist - Add or remove wishlist item
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clerkId, productId, action } = body

    if (!clerkId || !productId) {
      return NextResponse.json({ error: "Missing required fields (clerkId, productId)" }, { status: 400 })
    }

    const wishlist = await getOrCreateWishlist(clerkId)

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
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE /api/wishlist - Remove wishlist item
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkId = searchParams.get("clerkId")
    const productId = searchParams.get("productId")

    if (!clerkId || !productId) {
      return NextResponse.json({ error: "Missing required fields (clerkId, productId)" }, { status: 400 })
    }

    const wishlist = await getOrCreateWishlist(clerkId)

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
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
