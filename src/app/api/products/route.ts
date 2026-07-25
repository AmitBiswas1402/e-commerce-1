import { NextResponse } from "next/server"
import { db } from "@/lib"
import { products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { v5 as uuidv5 } from "uuid"
import { errorMessage, getCurrentDbUser, requireRole } from "@/lib/authorization"

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

function resolveCategoryName(dbCategoryName: string | null, productName: string, description: string = ""): string {
  if (dbCategoryName && dbCategoryName.trim()) {
    return dbCategoryName.trim()
  }

  const text = (productName + " " + description).toLowerCase()
  if (text.includes("book") || text.includes("habit") || text.includes("psychology") || text.includes("novel") || text.includes("paperback") || text.includes("stationery")) {
    return "Books and Stationery"
  }
  if (text.includes("headphone") || text.includes("monitor") || text.includes("speaker") || text.includes("mouse") || text.includes("keyboard") || text.includes("display") || text.includes("headset")) {
    return "Electronics"
  }
  if (text.includes("playstation") || text.includes("xbox") || text.includes("game") || text.includes("controller") || text.includes("console")) {
    return "Video Games"
  }
  if (text.includes("chair") || text.includes("table") || text.includes("lamp") || text.includes("furniture") || text.includes("sofa") || text.includes("desk")) {
    return "Home and Furniture"
  }
  if (text.includes("shirt") || text.includes("shoe") || text.includes("jacket") || text.includes("apparel") || text.includes("pant") || text.includes("cloth")) {
    return "Apparel"
  }
  if (text.includes("serum") || text.includes("oil") || text.includes("shampoo") || text.includes("cream") || text.includes("skin") || text.includes("hair")) {
    return "Beauty and Personal Care"
  }
  if (text.includes("fryer") || text.includes("cooker") || text.includes("kitchen") || text.includes("oven")) {
    return "Kitchen"
  }
  if (text.includes("dumbbell") || text.includes("gym") || text.includes("fitness") || text.includes("workout") || text.includes("sport")) {
    return "Gym and Fitness"
  }

  return "General"
}

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
        categoryId: products.categoryId,
        vendorId: products.vendorId,
        brandId: products.brandId,
        categoryName: categories.name,
        brandName: brands.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))

    const visibleRows = rows

    // Bulk-fetch images and variants in parallel (eliminating N+1 database roundtrips)
    const [allImages, allVariants] = await Promise.all([
      db.select().from(productImages).orderBy(productImages.sortOrder),
      db.select().from(productVariants),
    ])

    // Group images by productId
    const imagesMap = new Map<string, string[]>()
    for (const img of allImages) {
      if (!img.productId) continue
      const list = imagesMap.get(img.productId) || []
      list.push(img.imageUrl)
      imagesMap.set(img.productId, list)
    }

    // Group variants by productId
    const variantsMap = new Map<string, typeof allVariants>()
    for (const v of allVariants) {
      if (!v.productId) continue
      const list = variantsMap.get(v.productId) || []
      list.push(v)
      variantsMap.set(v.productId, list)
    }

    const mappedProducts = visibleRows.map((row) => {
      const dbImages = imagesMap.get(row.id) || []
      const dbVariants = variantsMap.get(row.id) || []

      const price = dbVariants[0]?.price || 0
      const compareAtPrice = dbVariants[0]?.compareAtPrice || price
      const stock = dbVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
      const inStock = stock > 0

      const category = resolveCategoryName(row.categoryName, row.name, row.description || "")

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || "",
        categoryId: row.categoryId,
        vendorId: row.vendorId || null,
        brandId: row.brandId,
        category: category,
        brand: row.brandName || "",
        price: price,
        originalPrice: compareAtPrice,
        stock: stock,
        status: row.status,
        isFeatured: row.isFeatured,
        isNewArrival: row.isNewArrival,
        rating: 4.5,
        reviewCount: 12,
        images: dbImages.length > 0 ? dbImages : ["/placeholder.jpg"],
        reviews: [],
        inStock: inStock,
      }
    })

    return NextResponse.json(mappedProducts)
  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/products - Create a new product
export async function POST(req: Request) {
  try {
    const access = await requireRole("VENDOR", "ADMIN")
    if (access.status) return NextResponse.json({ error: "Vendor or admin access required" }, { status: access.status })
    const body = await req.json()
    const {
      name,
      description,
      categoryId,
      brandId,
      price,
      compareAtPrice,
      stock,
      images,
      status,
      isFeatured,
      isNewArrival,
    } = body

    if (!name || !categoryId || price === undefined) {
      return NextResponse.json(
        { error: "Product name, category, and price are required" },
        { status: 400 }
      )
    }

    const prodSlug = slugify(name) + "-" + Date.now().toString().slice(-4)
    const productId = uuidv5(`prod-${prodSlug}`, UUID_NAMESPACE)

    // 1. Insert product
    await db.insert(products).values({
      id: productId,
      categoryId,
      vendorId: access.user.id,
      brandId: brandId || null,
      name,
      slug: prodSlug,
      description: description || null,
      status: status || ("PUBLISHED" as const),
      isFeatured: Boolean(isFeatured),
      isNewArrival: Boolean(isNewArrival),
    })

    // 2. Insert product images
    if (images && Array.isArray(images) && images.length > 0) {
      const validImages = images.filter((img: string) => Boolean(img.trim()))
      if (validImages.length > 0) {
        await db.insert(productImages).values(
          validImages.map((imageUrl: string, idx: number) => ({
            productId,
            imageUrl: imageUrl.trim(),
            sortOrder: idx,
          }))
        )
      }
    }

    // 3. Insert default variant
    const numPrice = Number(price) || 0
    const numComparePrice = compareAtPrice ? Number(compareAtPrice) : numPrice
    const numStock = stock !== undefined ? Number(stock) : 50

    await db.insert(productVariants).values({
      productId,
      sku: `SKU-${prodSlug.substring(0, 20).toUpperCase()}-DEF`,
      price: numPrice,
      compareAtPrice: numComparePrice,
      stock: numStock,
      isActive: true,
    })

    return NextResponse.json({ success: true, id: productId, slug: prodSlug })
  } catch (error) {
    console.error("POST /api/products error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to create product") }, { status: 500 })
  }
}

// PUT /api/products - Update an existing product
export async function PUT(req: Request) {
  try {
    const access = await requireRole("VENDOR", "ADMIN")
    if (access.status) return NextResponse.json({ error: "Vendor or admin access required" }, { status: access.status })
    const body = await req.json()
    const {
      id,
      name,
      description,
      categoryId,
      brandId,
      price,
      compareAtPrice,
      stock,
      images,
      status,
      isFeatured,
      isNewArrival,
    } = body

    if (!id || !name || !categoryId || price === undefined) {
      return NextResponse.json(
        { error: "Product ID, name, category, and price are required" },
        { status: 400 }
      )
    }
    const [existing] = await db.select({ vendorId: products.vendorId }).from(products).where(eq(products.id, id)).limit(1)
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    if (access.user.role === "VENDOR" && existing.vendorId && existing.vendorId !== access.user.id) {
      return NextResponse.json({ error: "You can only edit your own products" }, { status: 403 })
    }

    const prodSlug = slugify(name)

    // 1. Update product table
    await db
      .update(products)
      .set({
        name,
        slug: prodSlug,
        description: description || null,
        categoryId,
        vendorId: existing.vendorId,
        brandId: brandId || null,
        status: status || ("PUBLISHED" as const),
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))

    // 2. Update images (clear old, insert new)
    if (images && Array.isArray(images)) {
      await db.delete(productImages).where(eq(productImages.productId, id))
      const validImages = images.filter((img: string) => Boolean(img.trim()))
      if (validImages.length > 0) {
        await db.insert(productImages).values(
          validImages.map((imageUrl: string, idx: number) => ({
            productId: id,
            imageUrl: imageUrl.trim(),
            sortOrder: idx,
          }))
        )
      }
    }

    // 3. Update variant (clear old, insert updated default variant)
    await db.delete(productVariants).where(eq(productVariants.productId, id))
    const numPrice = Number(price) || 0
    const numComparePrice = compareAtPrice ? Number(compareAtPrice) : numPrice
    const numStock = stock !== undefined ? Number(stock) : 50

    await db.insert(productVariants).values({
      productId: id,
      sku: `SKU-${prodSlug.substring(0, 20).toUpperCase()}-DEF`,
      price: numPrice,
      compareAtPrice: numComparePrice,
      stock: numStock,
      isActive: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PUT /api/products error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to update product") }, { status: 500 })
  }
}

// DELETE /api/products - Delete product
export async function DELETE(req: Request) {
  try {
    const access = await requireRole("VENDOR", "ADMIN")
    if (access.status) return NextResponse.json({ error: "Vendor or admin access required" }, { status: access.status })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }
    const [existing] = await db.select({ vendorId: products.vendorId }).from(products).where(eq(products.id, id)).limit(1)
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    if (access.user.role === "VENDOR" && existing.vendorId && existing.vendorId !== access.user.id) {
      return NextResponse.json({ error: "You can only delete your own products" }, { status: 403 })
    }

    // Delete associated images & variants first (or cascade handles it)
    await db.delete(productImages).where(eq(productImages.productId, id))
    await db.delete(productVariants).where(eq(productVariants.productId, id))
    await db.delete(products).where(eq(products.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/products error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to delete product") }, { status: 500 })
  }
}
