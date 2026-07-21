import { NextResponse } from "next/server"
import { db } from "@/lib"
import { products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { PRODUCTS as MOCK_PRODUCTS } from "@/lib/products"
import { v5 as uuidv5 } from "uuid"

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
        brandId: products.brandId,
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
        const compareAtPrice = dbVariants[0]?.compareAtPrice || price
        const stock = dbVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
        const inStock = stock > 0

        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description || "",
          categoryId: row.categoryId,
          brandId: row.brandId,
          category: row.categoryName || "",
          brand: row.brandName || "",
          price: price,
          originalPrice: compareAtPrice,
          stock: stock,
          status: row.status,
          isFeatured: row.isFeatured,
          isNewArrival: row.isNewArrival,
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
    return NextResponse.json(MOCK_PRODUCTS)
  }
}

// POST /api/products - Create a new product
export async function POST(req: Request) {
  try {
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
  } catch (error: any) {
    console.error("POST /api/products error:", error)
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 })
  }
}

// PUT /api/products - Update an existing product
export async function PUT(req: Request) {
  try {
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

    const prodSlug = slugify(name)

    // 1. Update product table
    await db
      .update(products)
      .set({
        name,
        slug: prodSlug,
        description: description || null,
        categoryId,
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
  } catch (error: any) {
    console.error("PUT /api/products error:", error)
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 })
  }
}

// DELETE /api/products - Delete product
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Delete associated images & variants first (or cascade handles it)
    await db.delete(productImages).where(eq(productImages.productId, id))
    await db.delete(productVariants).where(eq(productVariants.productId, id))
    await db.delete(products).where(eq(products.id, id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE /api/products error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 })
  }
}
