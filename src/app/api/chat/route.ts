import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import arcjet, {
  detectBot,
  detectPromptInjection,
  sensitiveInfo,
  shield,
  tokenBucket,
} from "@arcjet/next"
import { convertToModelMessages, streamText } from "ai"
import { NextResponse } from "next/server"
import { db } from "@/lib"
import { products, categories, brands, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
})

// Initialize Arcjet Security Engine
const aj = arcjet({
  key: process.env.ARCJET_KEY || "ajkey_dummy",
  characteristics: ["userId"],
  rules: [
    // Web application firewall shield (SQLi, XSS, exploit protection)
    shield({ mode: "LIVE" }),

    // Bot detection engine
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),

    // Rate limiting token bucket
    tokenBucket({
      mode: "LIVE",
      refillRate: 1000,
      interval: "1h",
      capacity: 2000,
    }),

    // Sensitive info / PII filter (allow email for customer support, deny credit card numbers)
    sensitiveInfo({
      mode: "LIVE",
      deny: ["CREDIT_CARD_NUMBER"],
    }),

    // Prompt injection detection
    detectPromptInjection({
      mode: "LIVE",
    }),
  ],
})

export async function POST(req: Request) {
  try {
    // 1. Identify user or IP characteristic
    let userId = "guest-session"
    try {
      const authObj = await auth()
      if (authObj?.userId) userId = authObj.userId
    } catch {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
      if (ip) userId = `ip-${ip}`
    }

    const { messages } = await req.json().catch(() => ({ messages: [] }))
    const lastUserMessage = messages?.length > 0 ? messages[messages.length - 1]?.content || "" : ""

    // 2. Protect endpoint with Arcjet Security Rules
    if (process.env.ARCJET_KEY) {
      const decision = await aj.protect(req, {
        userId,
        requested: 5,
        sensitiveInfoValue: typeof lastUserMessage === "string" ? lastUserMessage : JSON.stringify(lastUserMessage),
        detectPromptInjectionMessage: typeof lastUserMessage === "string" ? lastUserMessage : JSON.stringify(lastUserMessage),
      })

      if (decision.isDenied()) {
        if (decision.reason.isBot()) {
          return new Response("Automated bot requests are not permitted on Velora Market AI.", { status: 403 })
        } else if (decision.reason.isRateLimit()) {
          return new Response("AI Chat Rate Limit Exceeded. Please try again in a few minutes.", { status: 429 })
        } else if (decision.reason.isSensitiveInfo()) {
          return new Response("Sensitive payment information (e.g. credit card) detected. Please do not share payment card details in chat.", { status: 400 })
        } else if (decision.reason.isPromptInjection()) {
          return new Response("Prompt security policy triggered. Please rephrase your shopping question.", { status: 400 })
        } else {
          return new Response("Access denied by Arcjet security rules.", { status: 403 })
        }
      }
    }

    // 3. Fetch Live E-Commerce Catalog from Neon DB safely
    let catalogSummary: any[] = []
    try {
      const dbRows = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          categoryName: categories.name,
          brandName: brands.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .limit(30)

      const allVariants = await db.select().from(productVariants)
      const variantsMap = new Map<string, typeof allVariants>()
      for (const v of allVariants) {
        if (!v.productId) continue
        const list = variantsMap.get(v.productId) || []
        list.push(v)
        variantsMap.set(v.productId, list)
      }

      catalogSummary = dbRows.map((p) => {
        const variants = variantsMap.get(p.id) || []
        const price = variants[0]?.price || 0
        const stock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)

        return {
          name: p.name,
          slug: p.slug,
          category: p.categoryName || "General",
          brand: p.brandName || "Generic",
          price: `₹${price.toLocaleString("en-IN")}`,
          stock: stock > 0 ? `${stock} in stock` : "Out of stock",
          description: p.description ? p.description.substring(0, 90) : "",
        }
      })
    } catch (dbErr) {
      console.warn("Neon DB catalog query warning in /api/chat:", dbErr)
      catalogSummary = []
    }

    // 4. System Instruction for E-Commerce Shopping Assistant
    const systemPrompt = `You are Velora AI Assistant — the official intelligent shopping assistant for Velora Market (an e-commerce store).

LIVE STORE CATALOG CONTEXT:
${JSON.stringify(catalogSummary, null, 2)}

STORE POLICIES & ADVANTAGES:
- Shipping: FREE delivery on all orders over ₹499. Standard shipping ₹99.
- Returns: 7-day hassle-free return and replacement policy.
- Warranty: All electronics and appliances come with 1-Year Brand Warranty.
- Payments: Accepts UPI, Credit/Debit Cards, NetBanking, and Razorpay.

RESPONSIBILITIES & INSTRUCTIONS:
1. Help customers find products, check live prices in INR (₹), check stock availability, and compare options.
2. Recommend products directly from the LIVE STORE CATALOG CONTEXT.
3. Be friendly, polite, professional, and concise. Format prices clearly with ₹ (e.g. ₹24,999).
4. If a user asks about shipping or returns, answer accurately according to store policies.
`

    let coreMessages: any[] = []
    try {
      if (Array.isArray(messages) && messages.length > 0) {
        coreMessages = await convertToModelMessages(messages)
      } else {
        coreMessages = [{ role: "user", content: "Hello" }]
      }
    } catch {
      coreMessages = (messages || []).map((m: any) => ({
        role: m.role || "user",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content || ""),
      }))
    }

    // 5. Select Model: Prefer OpenAI or Gemini 2.0
    let modelInstance: any = null

    if (process.env.OPENAI_API_KEY) {
      modelInstance = openai("gpt-4o-mini")
    } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      modelInstance = google("gemini-2.0-flash")
    } else {
      modelInstance = google("gemini-1.5-pro")
    }

    const result = streamText({
      model: modelInstance,
      system: systemPrompt,
      messages: coreMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("POST /api/chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat service error" },
      { status: 500 }
    );
  }
}