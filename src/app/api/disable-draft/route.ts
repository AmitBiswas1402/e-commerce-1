import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug") || "/"

  // Disable Draft Mode by clearing the cookies
  const draft = await draftMode()
  draft.disable()

  // Redirect back to the path
  redirect(slug)
}
