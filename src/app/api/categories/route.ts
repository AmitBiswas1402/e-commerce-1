import { NextResponse } from "next/server"
import { db } from "@/lib"
import { categories } from "@/db/schema"
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

// GET /api/categories - List all categories
export async function GET() {
  try {
    const list = await db.select().from(categories).orderBy(categories.name)
    return NextResponse.json(list)
  } catch (error) {
    console.error("GET /api/categories error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

// POST /api/categories - Create a new category
export async function POST(req: Request) {
  try {
    const access = await requireRole("ADMIN")
    if (access.status) return NextResponse.json({ error: "Admin access required" }, { status: access.status })
    const body = await req.json()
    const { name, description, imageUrl, isActive } = body

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const categorySlug = body.slug ? slugify(body.slug) : slugify(name)
    const categoryId = uuidv5(`cat-${categorySlug}-${Date.now()}`, UUID_NAMESPACE)

    await db.insert(categories).values({
      id: categoryId,
      name,
      slug: categorySlug,
      description: description || null,
      imageUrl: imageUrl || null,
      isActive: isActive !== undefined ? isActive : true,
    })

    return NextResponse.json({ success: true, id: categoryId, name, slug: categorySlug })
  } catch (error) {
    console.error("POST /api/categories error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to create category") }, { status: 500 })
  }
}

// PUT /api/categories - Update an existing category
export async function PUT(req: Request) {
  try {
    const access = await requireRole("ADMIN")
    if (access.status) return NextResponse.json({ error: "Admin access required" }, { status: access.status })
    const body = await req.json()
    const { id, name, slug, description, imageUrl, isActive } = body

    if (!id || !name) {
      return NextResponse.json({ error: "Category ID and name are required" }, { status: 400 })
    }

    const categorySlug = slug ? slugify(slug) : slugify(name)

    await db
      .update(categories)
      .set({
        name,
        slug: categorySlug,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PUT /api/categories error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to update category") }, { status: 500 })
  }
}

// DELETE /api/categories - Delete a category
export async function DELETE(req: Request) {
  try {
    const access = await requireRole("ADMIN")
    if (access.status) return NextResponse.json({ error: "Admin access required" }, { status: access.status })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    await db.delete(categories).where(eq(categories.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/categories error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to delete category") }, { status: 500 })
  }
}
