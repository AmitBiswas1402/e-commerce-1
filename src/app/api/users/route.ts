import { NextResponse } from "next/server"
import { db } from "@/lib"
import { users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

// Only this email is ADMIN — everyone else picks Customer or Vendor
const ADMIN_EMAIL = "amit.142biswas@gmail.com"

// GET /api/users — Fetch user by clerkId or filter by role
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkId = searchParams.get("clerkId")
    const roleFilter = searchParams.get("role")

    if (clerkId) {
      const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
      if (result.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })
      return NextResponse.json(result[0])
    }

    if (roleFilter) {
      const list = await db.select().from(users).where(eq(users.role, roleFilter as any)).orderBy(desc(users.createdAt))
      return NextResponse.json(list)
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt))
    return NextResponse.json(allUsers)
  } catch (error) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/users — Upsert user on every page load
// New users get role = null (blank). Admin email gets role = "ADMIN".
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clerkId, email, firstName, lastName, imageUrl } = body

    if (!clerkId || !email) {
      return NextResponse.json({ error: "Missing clerkId or email" }, { status: 400 })
    }

    const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL
    const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)

    if (existing.length === 0) {
      // Brand new user — role is NULL (blank) unless admin
      await db.insert(users).values({
        clerkId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        imageUrl: imageUrl || null,
        role: isAdmin ? "ADMIN" : null,
      })
    } else {
      // Existing user — update profile info only
      const updates: any = {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      }
      // Force admin if needed
      if (isAdmin && existing[0].role !== "ADMIN") {
        updates.role = "ADMIN"
      }
      await db.update(users).set(updates).where(eq(users.clerkId, clerkId))
    }

    const final = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    return NextResponse.json(final[0])
  } catch (error) {
    console.error("POST /api/users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/users — First-time role selection (fills the blank role column)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { clerkId, role } = body

    if (!clerkId || !role) return NextResponse.json({ error: "Missing clerkId or role" }, { status: 400 })
    if (!["CUSTOMER", "VENDOR"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 })

    await db.update(users).set({
      role: role as "CUSTOMER" | "VENDOR",
      updatedAt: new Date(),
    }).where(eq(users.clerkId, clerkId))

    return NextResponse.json({ success: true, role })
  } catch (error: any) {
    console.error("PATCH /api/users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
