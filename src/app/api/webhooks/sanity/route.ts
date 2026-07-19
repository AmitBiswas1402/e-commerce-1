import { type NextRequest, NextResponse } from "next/server"
import { parseBody } from "next-sanity/webhook"
import { v5 as uuidv5 } from "uuid"
import { db } from "@/lib"
import {
  categories,
  brands,
  products,
  productImages,
  productVariants,
} from "@/db/schema"
import { eq } from "drizzle-orm"

// Standard UUID namespace for deterministic UUID generation
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

interface SanityWebhookBody {
  _id: string;
  _type: string;
  _action?: "create" | "update" | "delete";
  name?: string;
  slug?: string | { current: string };
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  isActive?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured?: boolean;
  isNewArrival?: boolean;
  categoryRef?: string;
  brandRef?: string;
  images?: Array<{
    imageUrl: string;
    altText?: string;
    sortOrder?: number;
  }>;
  variants?: Array<{
    sku: string;
    color?: string;
    size?: string;
    price: number;
    compareAtPrice?: number;
    stock?: number;
    isActive?: boolean;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<SanityWebhookBody>(
      req,
      process.env.SANITY_REVALIDATE_SECRET
    )

    if (!isValidSignature) {
      return new Response("Invalid signature", { status: 401 })
    }

    if (!body?._id || !body?._type) {
      return new Response("Bad Request: Missing _id or _type", { status: 400 })
    }

    const { _id, _type, _action } = body
    const isDeleteAction = (_action as string) === "delete" || body._id.startsWith("drafts.") === false && (_action as string) === "delete"

    // ── Deterministic UUID ──
    const recordId = uuidv5(_id, UUID_NAMESPACE)

    // ─────────────────────────────────────────────────────────────────────────
    // 1. DELETE ACTION
    // ─────────────────────────────────────────────────────────────────────────
    if (isDeleteAction) {
      if (_type === "category") {
        await db.delete(categories).where(eq(categories.id, recordId))
      } else if (_type === "brand") {
        await db.delete(brands).where(eq(brands.id, recordId))
      } else if (_type === "product") {
        await db.delete(products).where(eq(products.id, recordId))
      }
      return NextResponse.json({ success: true, message: `Deleted ${_type} document` })
    }

    // Extract slug string safely
    const slugStr = typeof body.slug === "object" ? body.slug.current : body.slug

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CATEGORY SYNC
    // ─────────────────────────────────────────────────────────────────────────
    if (_type === "category") {
      if (!body.name || !slugStr) {
        return new Response("Missing name or slug for category", { status: 400 })
      }

      await db
        .insert(categories)
        .values({
          id: recordId,
          name: body.name,
          slug: slugStr,
          description: body.description || null,
          imageUrl: body.imageUrl || null,
          isActive: body.isActive !== undefined ? body.isActive : true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: body.name,
            description: body.description || null,
            imageUrl: body.imageUrl || null,
            isActive: body.isActive !== undefined ? body.isActive : true,
            updatedAt: new Date(),
          },
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. BRAND SYNC
    // ─────────────────────────────────────────────────────────────────────────
    else if (_type === "brand") {
      if (!body.name || !slugStr) {
        return new Response("Missing name or slug for brand", { status: 400 })
      }

      await db
        .insert(brands)
        .values({
          id: recordId,
          name: body.name,
          slug: slugStr,
          logoUrl: body.logoUrl || null,
          isActive: body.isActive !== undefined ? body.isActive : true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: brands.slug,
          set: {
            name: body.name,
            logoUrl: body.logoUrl || null,
            isActive: body.isActive !== undefined ? body.isActive : true,
            updatedAt: new Date(),
          },
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. PRODUCT SYNC
    // ─────────────────────────────────────────────────────────────────────────
    else if (_type === "product") {
      if (!body.name || !slugStr || !body.categoryRef) {
        return new Response("Missing name, slug or category reference", { status: 400 })
      }

      const categoryId = uuidv5(body.categoryRef, UUID_NAMESPACE)
      const brandId = body.brandRef ? uuidv5(body.brandRef, UUID_NAMESPACE) : null

      const productValues = {
        id: recordId,
        categoryId: categoryId,
        brandId: brandId,
        name: body.name,
        slug: slugStr,
        description: body.description || null,
        status: body.status || ("DRAFT" as const),
        isFeatured: body.isFeatured || false,
        isNewArrival: body.isNewArrival || false,
        updatedAt: new Date(),
      }

      // Upsert product record
      await db
        .insert(products)
        .values(productValues)
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            categoryId: productValues.categoryId,
            brandId: productValues.brandId,
            name: productValues.name,
            description: productValues.description,
            status: productValues.status,
            isFeatured: productValues.isFeatured,
            isNewArrival: productValues.isNewArrival,
            updatedAt: new Date(),
          },
        })

      // Sync Images (clear and insert)
      await db.delete(productImages).where(eq(productImages.productId, recordId))
      if (body.images && body.images.length > 0) {
        const imagesToInsert = body.images.map((img) => ({
          productId: recordId,
          imageUrl: img.imageUrl,
          altText: img.altText || null,
          sortOrder: img.sortOrder !== undefined ? img.sortOrder : 0,
        }))
        await db.insert(productImages).values(imagesToInsert)
      }

      // Sync Variants (clear and insert)
      await db.delete(productVariants).where(eq(productVariants.productId, recordId))
      if (body.variants && body.variants.length > 0) {
        const variantsToInsert = body.variants.map((v) => ({
          productId: recordId,
          sku: v.sku,
          color: v.color || null,
          size: v.size || null,
          price: v.price,
          compareAtPrice: v.compareAtPrice || null,
          stock: v.stock !== undefined ? v.stock : 0,
          isActive: v.isActive !== undefined ? v.isActive : true,
          updatedAt: new Date(),
        }))
        await db.insert(productVariants).values(variantsToInsert)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${_type} document with Postgres DB`,
    })
  } catch (err: any) {
    console.error("Sanity DB Synchronization error:", err)
    return new Response(err.message, { status: 500 })
  }
}
