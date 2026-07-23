import { NextResponse } from "next/server"
import { db } from "@/lib"
import { brands } from "@/db/schema"
import { eq } from "drizzle-orm"
import { v5 as uuidv5 } from "uuid"
import { errorMessage, requireRole } from "@/lib/authorization"

const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

function slugify(name: string): string {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// GET /api/brands - Fetch all brands
export async function GET() {
  try {
    const list = await db.select().from(brands).orderBy(brands.name)
    return NextResponse.json(list)
  } catch (error) {
    console.error("GET /api/brands error:", error)
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
  }
}

// POST /api/brands - Create a new brand
export async function POST(req: Request) {
  try {
    const access = await requireRole("ADMIN")
    if (access.status) return NextResponse.json({ error: "Admin access required" }, { status: access.status })
    const body = await req.json()
    const { name, logoUrl, isActive } = body

    if (!name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 })
    }

    const brandSlug = body.slug ? slugify(body.slug) : slugify(name)
    const brandId = uuidv5(`brand-${brandSlug}-${Date.now()}`, UUID_NAMESPACE)

    await db.insert(brands).values({
      id: brandId,
      name,
      slug: brandSlug,
      logoUrl: logoUrl || null,
      isActive: isActive !== undefined ? isActive : true,
    })

    return NextResponse.json({ success: true, id: brandId, name, slug: brandSlug })
  } catch (error) {
    console.error("POST /api/brands error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to create brand") }, { status: 500 })
  }
}

// PUT /api/brands - Update an existing brand
export async function PUT(req: Request) {
  try {
    const access = await requireRole("ADMIN")
    if (access.status) return NextResponse.json({ error: "Admin access required" }, { status: access.status })
    const body = await req.json()
    const { id, name, slug, logoUrl, isActive } = body

    if (!id || !name) {
      return NextResponse.json({ error: "Brand ID and name are required" }, { status: 400 })
    }

    const brandSlug = slug ? slugify(slug) : slugify(name)

    await db
      .update(brands)
      .set({
        name,
        slug: brandSlug,
        logoUrl: logoUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PUT /api/brands error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to update brand") }, { status: 500 })
  }
}

// DELETE /api/brands - Delete a brand
export async function DELETE(req: Request) {
  try {
    const access = await requireRole("ADMIN")
    if (access.status) return NextResponse.json({ error: "Admin access required" }, { status: access.status })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 })
    }

    await db.delete(brands).where(eq(brands.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/brands error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to delete brand") }, { status: 500 })
  }
}
