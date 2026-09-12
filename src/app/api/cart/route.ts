import { NextResponse } from "next/server"
import { eq, inArray } from "drizzle-orm"
import { db } from "@/lib"
import {
  carts,
  cartItems,
  products,
  categories,
  productImages,
  productVariants,
} from "@/db/schema"
import { errorMessage, getCurrentDbUser } from "@/lib/authorization"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getOrCreateCart(userId: string) {
  const [existing] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1)
  if (existing) return existing
  const [created] = await db.insert(carts).values({ userId }).returning()
  if (!created) throw new Error("Failed to create cart")
  return created
}

async function mapCartItems(userId: string) {
  const cart = await getOrCreateCart(userId)
  const rows = await db
    .select({
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id))
    .orderBy(cartItems.createdAt)

  if (rows.length === 0) return []

  const variantIds = rows.map((r) => r.variantId)
  const variants = await db.select().from(productVariants).where(inArray(productVariants.id, variantIds))
  const productIds = [...new Set(variants.map((v) => v.productId))]

  const [productRows, images, cats] = await Promise.all([
    db.select().from(products).where(inArray(products.id, productIds)),
    db.select().from(productImages).orderBy(productImages.sortOrder),
    db.select().from(categories),
  ])

  const imagesMap = new Map<string, string[]>()
  for (const img of images) {
    if (!img.productId) continue
    const list = imagesMap.get(img.productId) || []
    list.push(img.imageUrl)
    imagesMap.set(img.productId, list)
  }

  const catMap = new Map(cats.map((c) => [c.id, c]))

  const items: { product: Record<string, unknown>; quantity: number }[] = []
  for (const row of rows) {
    const variant = variants.find((v) => v.id === row.variantId)
    if (!variant) continue
    const prod = productRows.find((p) => p.id === variant.productId)
    if (!prod) continue

    const category = catMap.get(prod.categoryId)
    const dbImages = imagesMap.get(prod.id) || []

    items.push({
      product: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description || "",
        category: category?.name || "",
        price: variant.price,
        originalPrice: variant.compareAtPrice || variant.price,
        rating: 0,
        reviewCount: 0,
        reviews: [],
        images: dbImages.length > 0 ? dbImages : ["/placeholder.jpg"],
        inStock: variant.stock > 0 && variant.isActive,
      },
      quantity: row.quantity,
    })
  }

  return items
}

// GET /api/cart - Fetch the signed-in user's persisted cart
export async function GET() {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const items = await mapCartItems(current.id)
    return NextResponse.json(items)
  } catch (error) {
    console.error("GET /api/cart error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to fetch cart") }, { status: 500 })
  }
}

// POST /api/cart - Replace the signed-in user's persisted cart with items
export async function POST(req: Request) {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = await req.json()
    const items = body?.items as { productId?: string; quantity?: number }[] | undefined
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items must be an array" }, { status: 400 })
    }

    const cart = await getOrCreateCart(current.id)

    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))

    if (items.length > 0) {
      const variantPairs: { variantId: string; quantity: number }[] = []
      for (const item of items) {
        if (!item.productId) continue
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, item.productId))
          .limit(1)
        if (!variant) continue
        variantPairs.push({ variantId: variant.id, quantity })
      }

      if (variantPairs.length > 0) {
        await db.insert(cartItems).values(
          variantPairs.map((vp) => ({
            cartId: cart.id,
            variantId: vp.variantId,
            quantity: vp.quantity,
          }))
        )
      }
    }

    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/cart error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to save cart") }, { status: 500 })
  }
}