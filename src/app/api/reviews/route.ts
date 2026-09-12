import { NextResponse } from "next/server"
import { and, avg, count, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib"
import { reviews, users, orders, orderItems } from "@/db/schema"
import { errorMessage, getCurrentDbUser } from "@/lib/authorization"

export const dynamic = "force-dynamic"
export const revalidate = 0

// GET /api/reviews?productId=... - List reviews for a product with real averages
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 })

    const current = await getCurrentDbUser()

    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        createdAt: reviews.createdAt,
        userId: reviews.userId,
        author: users.firstName,
        authorLastName: users.lastName,
        avatar: users.imageUrl,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))

    const agg = await db
      .select({ average: avg(reviews.rating), total: count() })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .limit(1)

    const averageRating = Number(agg[0]?.average || 0)
    const reviewCount = Number(agg[0]?.total || 0)

    return NextResponse.json({
      averageRating: averageRating > 0 ? Number(averageRating.toFixed(1)) : 0,
      reviewCount,
      mine: rows.some((r) => r.userId === current?.id),
      reviews: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.content,
        verified: r.isVerifiedPurchase,
        date: r.createdAt.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        author: [r.author, r.authorLastName].filter(Boolean).join(" ") || "Verified Buyer",
        avatar: r.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      })),
    })
  } catch (error) {
    console.error("GET /api/reviews error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to fetch reviews") }, { status: 500 })
  }
}

// POST /api/reviews - Submit a review for a product (authenticated customer)
export async function POST(req: Request) {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = await req.json()
    const { productId, rating, title, content } = body as {
      productId?: string
      rating?: number
      title?: string
      content?: string
    }

    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 })
    const numRating = Math.round(Number(rating))
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Review content is required" }, { status: 400 })
    }

    // Enforce unique user + product constraint
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, current.id), eq(reviews.productId, productId)))
      .limit(1)
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 })
    }

    // isVerifiedPurchase: has a PAID order containing this product
    let isVerified = false
    try {
      const paidOrderItems = await db
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(eq(orderItems.productId, productId))
      const orderIds = paidOrderItems.map((o) => o.orderId)
      if (orderIds.length > 0) {
        const paid = await db
          .select({ id: orders.id })
          .from(orders)
          .where(
            and(
              eq(orders.userId, current.id),
              inArray(orders.id, orderIds),
              eq(orders.paymentStatus, "PAID")
            )
          )
          .limit(1)
        isVerified = paid.length > 0
      }
    } catch (verifyErr) {
      console.warn("Failed to compute verified purchase:", verifyErr)
    }

    const [saved] = await db
      .insert(reviews)
      .values({
        userId: current.id,
        productId,
        rating: numRating,
        title: title ? String(title).trim() || null : null,
        content: content.trim(),
        isVerifiedPurchase: isVerified,
      })
      .onConflictDoNothing()
      .returning()

    if (!saved) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 })
    }

    return NextResponse.json({ success: true, review: saved })
  } catch (error) {
    console.error("POST /api/reviews error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to submit review") }, { status: 500 })
  }
}

// DELETE /api/reviews?productId=... - Remove the authenticated user's own review
export async function DELETE(req: Request) {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 })

    await db
      .delete(reviews)
      .where(and(eq(reviews.userId, current.id), eq(reviews.productId, productId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/reviews error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to delete review") }, { status: 500 })
  }
}