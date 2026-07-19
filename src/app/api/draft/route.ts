import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  const slug = searchParams.get("slug") || "/"

  // Validate the preview secret
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response("Invalid token", { status: 401 })
  }

  // Enable Draft Mode by setting the cookies
  const draft = await draftMode()
  draft.enable()

  // Redirect to the path we want to preview
  redirect(slug)
}
