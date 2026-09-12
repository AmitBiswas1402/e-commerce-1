import { NextResponse } from "next/server"
import { desc, eq, and } from "drizzle-orm"
import { db } from "@/lib"
import { addresses } from "@/db/schema"
import { errorMessage, getCurrentDbUser } from "@/lib/authorization"

export const dynamic = "force-dynamic"
export const revalidate = 0

type ShippingAddressInput = {
  fullName?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  label?: string
  isDefault?: boolean
}

export function normalizeAddress(input: ShippingAddressInput) {
  return {
    fullName: input.fullName || "",
    phone: input.phone || "",
    addressLine1: input.addressLine1 || "",
    addressLine2: input.addressLine2 || null,
    city: input.city || "",
    state: input.state || "",
    postalCode: input.postalCode || "",
    country: input.country || "India",
    label: input.label || "Home",
    isDefault: input.isDefault !== undefined ? input.isDefault : true,
  }
}

// GET /api/addresses - List the authenticated user's saved addresses
export async function GET() {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const list = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, current.id))
      .orderBy(desc(addresses.createdAt))

    return NextResponse.json(list)
  } catch (error) {
    console.error("GET /api/addresses error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to fetch addresses") }, { status: 500 })
  }
}

// POST /api/addresses - Save a shipping address for the authenticated user
export async function POST(req: Request) {
  try {
    const current = await getCurrentDbUser()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = (await req.json()) as ShippingAddressInput
    const addr = normalizeAddress(body)

    if (!addr.fullName || !addr.phone || !addr.addressLine1 || !addr.city || !addr.state || !addr.postalCode) {
      return NextResponse.json(
        { error: "Name, phone, address line 1, city, state, and postal code are required" },
        { status: 400 }
      )
    }

    // If marking as default, unset any existing default first
    if (addr.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, current.id))
    }

    const [saved] = await db
      .insert(addresses)
      .values({ ...addr, userId: current.id })
      .returning()

    if (!saved) {
      return NextResponse.json({ error: "Failed to save address" }, { status: 500 })
    }

    // Optionally clear existing defaults if the query had isDefault true
    if (!addr.isDefault) {
      const existingDefault = await db
        .select({ id: addresses.id })
        .from(addresses)
        .where(and(eq(addresses.userId, current.id), eq(addresses.isDefault, true)))
        .limit(1)
      if (existingDefault.length === 0) {
        await db
          .update(addresses)
          .set({ isDefault: true })
          .where(eq(addresses.id, saved.id))
      }
    }

    return NextResponse.json(saved)
  } catch (error) {
    console.error("POST /api/addresses error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to save address") }, { status: 500 })
  }
}