import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { db } from "@/lib"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env")
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occured", {
      status: 400,
    })
  }

  const { id: clerkId } = evt.data
  const eventType = evt.type



  if (eventType === "user.created" || eventType === "user.updated") {
    const { email_addresses, first_name, last_name, image_url } = evt.data
    const email = email_addresses?.[0]?.email_address

    if (!email) {
      return new Response("Missing email address", { status: 400 })
    }

    const userData = {
      clerkId: clerkId as string,
      email: email,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
      role: "CUSTOMER" as const, // default role
    }

    try {
      // 1. Sync to Postgres Database
      await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.clerkId,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            imageUrl: userData.imageUrl,
            updatedAt: new Date(),
          },
        })



      return new Response("User synced successfully", { status: 200 })
    } catch (dbError) {
      console.error("Database sync error (user.created/updated):", dbError)
      return new Response("Database error", { status: 500 })
    }
  }

  if (eventType === "user.deleted") {
    try {
      // 1. Delete from Postgres Database
      await db.delete(users).where(eq(users.clerkId, clerkId as string))



      return new Response("User deleted successfully", { status: 200 })
    } catch (dbError) {
      console.error("Database sync error (user.deleted):", dbError)
      return new Response("Database error", { status: 500 })
    }
  }

  return new Response("Webhook processed", { status: 200 })
}
