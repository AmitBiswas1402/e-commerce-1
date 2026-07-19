import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { parseBody } from "next-sanity/webhook"

interface WebhookBody {
  _type: string;
  id?: string;
  slug?: { current: string };
}

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<WebhookBody>(
      req,
      process.env.SANITY_REVALIDATE_SECRET
    )

    if (!isValidSignature) {
      return new Response("Invalid signature", { status: 401 })
    }

    if (!body?._type) {
      return new Response("Bad Request: Missing _type", { status: 400 })
    }

    // Revalidate index page for any CMS updates
    revalidatePath("/")

    // If it's a product, revalidate that product detail page
    if (body._type === "product" && body.slug?.current) {
      revalidatePath(`/${body.slug.current}`)
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      type: body._type,
    })
  } catch (err: any) {
    console.error("Revalidation error:", err)
    return new Response(err.message, { status: 500 })
  }
}
