import { NextResponse } from "next/server"
import crypto from "crypto"
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm"
import { db } from "@/lib"
import {
  orders,
  orderItems,
  payments,
  products,
  productVariants,
  productImages,
  addresses,
  users,
} from "@/db/schema"
import { errorMessage, getCurrentDbUser, requireRole } from "@/lib/authorization"
import { normalizeAddress } from "@/app/api/addresses/route"

export const dynamic = "force-dynamic"
export const revalidate = 0

const keySecret = process.env.RAZORPAY_KEY_SECRET || ""

type OrderItemInput = {
  productId?: string
  variantId?: string
  quantity?: number
}

type ShippingAddressInput = {
  fullName?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!keySecret) return false
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
  return expected === signature
}

async function resolveVariant(productId: string, variantId?: string) {
  if (variantId) {
    const [v] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1)
    if (v) return v
  }
  const [first] = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)))
    .orderBy(productVariants.createdAt)
    .limit(1)
  return first ?? null
}

type OrderWithItems = {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  subtotal: number
  shippingAmount: number
  discountAmount: number
  totalAmount: number
  shippingFullName: string
  shippingPhone: string
  shippingAddressLine1: string
  shippingAddressLine2: string | null
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingCountry: string
  createdAt: Date
  items: {
    id: string
    productId: string | null
    variantId: string | null
    productName: string
    variantName: string | null
    sku: string
    unitPrice: number
    quantity: number
    totalPrice: number
    image: string
  }[]
  customer?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}

async function buildOrdersWithItems(
  orderRows: (typeof orders.$inferSelect)[],
  opts: { includeCustomer?: boolean } = {}
): Promise<OrderWithItems[]> {
  if (orderRows.length === 0) return []

  const orderIds = orderRows.map((o) => o.id)

  const [itemsRows, imageRows, customerRows] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)).orderBy(orderItems.createdAt),
    db.select().from(productImages).orderBy(productImages.sortOrder),
    opts.includeCustomer
      ? db.select().from(users).where(inArray(users.id, orderRows.map((o) => o.userId)))
      : Promise.resolve([]),
  ])

  const imagesMap = new Map<string, string>()
  for (const img of imageRows) {
    if (img.productId && !imagesMap.has(img.productId)) {
      imagesMap.set(img.productId, img.imageUrl)
    }
  }

  const customersMap = new Map(customerRows.map((u) => [u.id, u]))

  return orderRows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    subtotal: o.subtotal,
    shippingAmount: o.shippingAmount,
    discountAmount: o.discountAmount,
    totalAmount: o.totalAmount,
    shippingFullName: o.shippingFullName,
    shippingPhone: o.shippingPhone,
    shippingAddressLine1: o.shippingAddressLine1,
    shippingAddressLine2: o.shippingAddressLine2,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    shippingPostalCode: o.shippingPostalCode,
    shippingCountry: o.shippingCountry,
    createdAt: o.createdAt,
    items: itemsRows
      .filter((it) => it.orderId === o.id)
      .map((it) => ({
        id: it.id,
        productId: it.productId,
        variantId: it.variantId,
        productName: it.productName,
        variantName: it.variantName,
        sku: it.sku,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        totalPrice: it.totalPrice,
        image: (it.productId && imagesMap.get(it.productId)) || "/placeholder.jpg",
      })),
    ...(opts.includeCustomer
      ? {
          customer: customersMap.get(o.userId)
            ? {
                id: customersMap.get(o.userId)!.id,
                email: customersMap.get(o.userId)!.email,
                firstName: customersMap.get(o.userId)!.firstName,
                lastName: customersMap.get(o.userId)!.lastName,
              }
            : undefined,
        }
      : {}),
  }))
}

// POST /api/orders - Persist a verified, paid order
export async function POST(req: Request) {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = await req.json()
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items = [],
      shippingAddress,
    } = body as {
      razorpayOrderId?: string
      razorpayPaymentId?: string
      razorpaySignature?: string
      items?: OrderItemInput[]
      shippingAddress?: ShippingAddressInput
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Verified Razorpay payment details are required" },
        { status: 400 }
      )
    }

    // Only proceed if the payment signature is authentic
    const isAuthentic = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!isAuthentic) {
      return NextResponse.json({ error: "Invalid payment signature verification failed" }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 })
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 })
    }
    const addr = normalizeAddress(shippingAddress)
    if (!addr.fullName || !addr.phone || !addr.addressLine1 || !addr.city || !addr.state || !addr.postalCode) {
      return NextResponse.json(
        { error: "Name, phone, address line 1, city, state, and postal code are required" },
        { status: 400 }
      )
    }

    // Resolve real prices from the database - never trust the client
    const orderItemRows: {
      productId: string
      variantId: string
      productName: string
      variantName: string | null
      sku: string
      unitPrice: number
      quantity: number
    }[] = []

    for (const item of items) {
      if (!item.productId) continue
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))

      const [prod] = await db
        .select({ id: products.id, name: products.name })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1)
      if (!prod) continue

      const variant = await resolveVariant(prod.id, item.variantId)
      if (!variant) continue

      const variantName =
        [variant.color, variant.size].filter(Boolean).join(" / ") || null

      orderItemRows.push({
        productId: prod.id,
        variantId: variant.id,
        productName: prod.name,
        variantName,
        sku: variant.sku,
        unitPrice: variant.price,
        quantity,
      })
    }

    if (orderItemRows.length === 0) {
      return NextResponse.json({ error: "No purchasable items found in order" }, { status: 400 })
    }

    const subtotal = orderItemRows.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0)
    const shippingAmount = subtotal >= 499 ? 0 : 99
    const discountAmount = 0
    const tax = Math.round(subtotal * 0.05)
    const totalAmount = subtotal + shippingAmount + tax

    const orderNumber = `VEL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: current.id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        subtotal,
        shippingAmount,
        discountAmount,
        totalAmount,
        shippingFullName: addr.fullName,
        shippingPhone: addr.phone,
        shippingAddressLine1: addr.addressLine1,
        shippingAddressLine2: addr.addressLine2,
        shippingCity: addr.city,
        shippingState: addr.state,
        shippingPostalCode: addr.postalCode,
        shippingCountry: addr.country,
      })
      .returning()

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Insert order items
    await db.insert(orderItems).values(
      orderItemRows.map((r) => ({
        orderId: order.id,
        productId: r.productId,
        variantId: r.variantId,
        productName: r.productName,
        variantName: r.variantName,
        sku: r.sku,
        unitPrice: r.unitPrice,
        quantity: r.quantity,
        totalPrice: r.unitPrice * r.quantity,
      }))
    )

    // Insert payment row
    await db.insert(payments).values({
      orderId: order.id,
      provider: "razorpay",
      providerPaymentId: razorpayPaymentId,
      amount: totalAmount,
      status: "PAID",
    })

    // Decrement stock atomically for each purchased variant
    for (const r of orderItemRows) {
      await db
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} - ${r.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, r.variantId))
    }

    // Persist the shipping address to the addresses table
    try {
      await db.insert(addresses).values({
        userId: current.id,
        label: "Home",
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: true,
      })
    } catch (addrErr) {
      console.warn("Failed to persist address row:", addrErr)
    }

    // Send order confirmation email in the background with the real address
    try {
      const origin = req.headers.get("origin") || "http://localhost:3000"
      const addressLine = [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", ")
      const fullAddress = `${addressLine}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`
      fetch(`${origin}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ORDER_CONFIRMATION",
          to: current.email,
          customerName: current.email.split("@")[0] || "Valued Customer",
          orderId: order.orderNumber,
          items: orderItemRows.map((r) => ({
            name: r.productName,
            quantity: r.quantity,
            price: r.unitPrice,
          })),
          totalAmount,
          shippingAddress: fullAddress,
        }),
      }).catch((emailErr) => console.error("Order confirmation email dispatch error:", emailErr))
    } catch (emailErr) {
      console.error("Order confirmation email error:", emailErr)
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
      },
    })
  } catch (error) {
    console.error("POST /api/orders error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to create order") }, { status: 500 })
  }
}

// GET /api/orders - Customer order history (admin: all, vendor: own products only)
export async function GET() {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    if (current.role === "ADMIN") {
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt))
      const result = await buildOrdersWithItems(rows, { includeCustomer: true })
      return NextResponse.json(result)
    }

    if (current.role === "VENDOR") {
      // Orders containing at least one item that belongs to this vendor's products
      const vendorProductIds = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.vendorId, current.id))
      const ids = vendorProductIds.map((p) => p.id)
      if (ids.length === 0) return NextResponse.json([])

      const matchingItems = await db
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(
          and(
            isNotNull(orderItems.productId),
            inArray(orderItems.productId, ids)
          )
        )
      const orderIds = [...new Set(matchingItems.map((m) => m.orderId))]
      if (orderIds.length === 0) return NextResponse.json([])

      const rows = await db
        .select()
        .from(orders)
        .where(inArray(orders.id, orderIds))
        .orderBy(desc(orders.createdAt))

      const result = await buildOrdersWithItems(rows)
      // Keep only orders, but preserve all items for vendor visibility
      return NextResponse.json(result)
    }

    // CUSTOMER: only their own orders
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, current.id))
      .orderBy(desc(orders.createdAt))

    const result = await buildOrdersWithItems(rows)
    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/orders error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to fetch orders") }, { status: 500 })
  }
}

// PATCH /api/orders - Update order status (admin only)
export async function PATCH(req: Request) {
  try {
    const access = await requireRole("ADMIN")
    if (access.status) return NextResponse.json({ error: "Admin access required" }, { status: access.status })

    const body = await req.json()
    const { id, status } = body as { id?: string; status?: string }

    if (!id) return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    if (!status || !ORDER_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 })
    }

    const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    await db
      .update(orders)
      .set({ status: status as OrderStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))

    return NextResponse.json({ success: true, id, status })
  } catch (error) {
    console.error("PATCH /api/orders error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to update order") }, { status: 500 })
  }
}