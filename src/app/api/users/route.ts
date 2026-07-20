import { NextResponse } from "next/server"
import { db } from "@/lib"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET /api/users - Fetch user by clerkId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkId = searchParams.get("clerkId")

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId parameter" }, { status: 400 })
    }

    const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    
    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/users - Upsert user profile
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clerkId, email, firstName, lastName, imageUrl } = body

    if (!clerkId || !email) {
      return NextResponse.json({ error: "Missing required fields (clerkId, email)" }, { status: 400 })
    }

    // 1. Drizzle ORM insert/update in Postgres
    await db
      .insert(users)
      .values({
        clerkId,
        email,
        firstName,
        lastName,
        imageUrl,
        role: "CUSTOMER",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          firstName,
          lastName,
          imageUrl,
          updatedAt: new Date(),
        },
      })



    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
