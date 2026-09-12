import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { db } from "@/lib"
import { products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProductCompact = {
  id: string
  name: string
  category: string
  brand?: string
  description?: string
  price: number
}

function fastTokenizerSearch(query: string, allProducts: ProductCompact[]) {
  const q = query.toLowerCase().trim()
  if (!q) return { matchedProductIds: [], intentSummary: "" }

  // Extract price limit if present (e.g. "under 6k", "under 30000", "below 5000")
  let maxPrice: number | null = null
  const priceMatch = q.match(/(?:under|below|less than|max)\s*(?:₹|rs\.?|inr)?\s*(\d+)(k)?/i)
  if (priceMatch) {
    const val = parseInt(priceMatch[1], 10)
    maxPrice = priceMatch[2] ? val * 1000 : val
  }

  // Remove common English stopwords
  const stopWords = new Set(["for", "a", "an", "the", "in", "on", "at", "with", "by", "of", "to", "day", "setup", "under", "below", "less", "than", "and", "or", "rs", "inr"])
  const tokens = q.split(/\s+/).map(t => t.replace(/[^\w]/g, "")).filter((t) => t.length > 1 && !stopWords.has(t))

  // Identify primary intent product types
  const isShoeQuery = tokens.some(t => ["shoes", "shoe", "sneaker", "footwear", "running"].includes(t))
  const isAudioQuery = tokens.some(t => ["headphone", "headphones", "earbuds", "earbud", "audio", "headset", "speaker"].includes(t))
  const isGamingQuery = tokens.some(t => ["game", "gaming", "controller", "playstation", "xbox", "console"].includes(t))
  const isDesktopQuery = tokens.some(t => ["desktop", "monitor", "display", "keyboard", "mouse", "desk", "chair"].includes(t))
  const isBookQuery = tokens.some(t => ["book", "books", "habit", "novel", "read"].includes(t))

  const scored = allProducts.map((p) => {
    let score = 0

    // Price filter constraint
    if (maxPrice !== null && p.price > maxPrice) {
      return { id: p.id, score: -100 }
    }

    const nameText = p.name.toLowerCase()
    const catText = (p.category || "").toLowerCase()
    const descText = (p.description || "").toLowerCase()
    const fullText = `${nameText} ${catText} ${descText}`

    // Complete exact string match
    if (fullText.includes(q)) score += 100
    if (nameText.includes(q)) score += 150

    // Product Type Constraints
    if (isShoeQuery) {
      if (nameText.includes("shoe") || nameText.includes("sneaker") || nameText.includes("running") || catText.includes("shoes") || catText.includes("sports")) score += 80
      else if (catText.includes("audio") || nameText.includes("headphone") || nameText.includes("earbud")) return { id: p.id, score: -100 }
    }

    if (isAudioQuery) {
      if (nameText.includes("headphone") || nameText.includes("earbud") || nameText.includes("audio") || nameText.includes("headset") || catText.includes("electronics")) score += 80
      else if (catText.includes("apparel") || nameText.includes("shoe")) return { id: p.id, score: -100 }
    }

    if (isDesktopQuery) {
      if (nameText.includes("monitor") || nameText.includes("chair") || nameText.includes("keyboard") || nameText.includes("mouse") || nameText.includes("desk") || catText.includes("furniture") || catText.includes("electronics")) score += 80
    }

    if (isBookQuery) {
      if (catText.includes("book") || nameText.includes("book") || nameText.includes("habit") || nameText.includes("psychology")) score += 80
    }

    tokens.forEach((tok) => {
      if (nameText.includes(tok)) score += 25
      else if (catText.includes(tok)) score += 15
      else if (descText.includes(tok)) score += 5
    })

    return { id: p.id, score }
  })

  const matchingIds = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.id)

  return {
    matchedProductIds: matchingIds,
    intentSummary: `Found ${matchingIds.length} relevant items matching "${query}"`
  }
}

export async function POST(req: Request) {
  try {
    const { query, products: inputProducts } = await req.json()

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ matchedProductIds: [], intentSummary: "" })
    }

    const cleanQuery = query.trim()

    // 1. Fetch catalog products if not passed
    let catalog: ProductCompact[] = []

    if (Array.isArray(inputProducts) && inputProducts.length > 0) {
      catalog = inputProducts.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        category: p.category || "",
        brand: p.brand || "",
        description: p.description || "",
        price: p.price || 0,
      }))
    } else {
      const dbRows = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          categoryName: categories.name,
          brandName: brands.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))

      catalog = await Promise.all(
        dbRows.map(async (row) => {
          const dbVariants = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, row.id))
          const price = dbVariants[0]?.price || 0

          return {
            id: String(row.id),
            name: row.name,
            category: row.categoryName || "",
            brand: row.brandName || "",
            description: row.description || "",
            price,
          }
        })
      )
    }

    const rawApiKey = process.env.GEMINI_API_KEY
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : ""

    if (apiKey && catalog.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey })

        const catalogSummary = catalog.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: `₹${p.price}`,
          descSnippet: p.description ? p.description.substring(0, 80) : ""
        }))

        const systemInstruction = `You are an expert AI search relevance evaluator for an e-commerce catalog.
Customer Query: "${cleanQuery}"

Target Store Catalog:
${JSON.stringify(catalogSummary)}

CRITICAL RELEVANCE RULES:
1. MUST ONLY return products that directly match the customer's intent product type!
   - Query 'Lightweight shoes for rainy day running' -> MUST ONLY match shoes, sneakers, trail running footwear or running apparel! DO NOT return headphones, earbuds, monitors, or books!
   - Query 'Setup for work from home desktop' -> MUST ONLY match monitors, keyboards, mice, desks, office chairs! DO NOT return shoes or hair oil!
   - Query 'Gifts for a gamer under 6k' -> MUST ONLY match gaming controllers, gaming accessories, or video game gear priced <= ₹6000!
2. Rank the top matches by highest relevance at index 0.

Respond strictly in JSON schema:
{
  "matchedProductIds": ["id1", "id2"],
  "intentSummary": "Matched 3 items..."
}
`

        const modelsToTry = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash"]
        let textResult = ""

        for (const modelName of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [
                { role: "user", parts: [{ text: systemInstruction }] }
              ],
              config: {
                responseMimeType: "application/json",
              }
            })
            if (response.text) {
              textResult = response.text
              break
            }
          } catch (err) {
            console.warn(`Gemini AI search model ${modelName} failed:`, err)
          }
        }

        if (textResult) {
          const cleanJson = textResult.replace(/```json/gi, "").replace(/```/g, "").trim()
          let parsed: any = null
          try {
            parsed = JSON.parse(cleanJson)
          } catch {
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                parsed = JSON.parse(jsonMatch[0])
              } catch {}
            }
          }

          if (parsed && parsed.matchedProductIds && Array.isArray(parsed.matchedProductIds) && parsed.matchedProductIds.length > 0) {
            return NextResponse.json({
              matchedProductIds: parsed.matchedProductIds.map(String),
              intentSummary: parsed.intentSummary || `AI Matched items for "${cleanQuery}"`
            })
          }
        }
      } catch (geminiErr) {
        console.error("Gemini AI search error, using fast tokenizer fallback:", geminiErr)
      }
    }

    // Fast Tokenizer Search Fallback
    const fallbackResult = fastTokenizerSearch(cleanQuery, catalog)
    return NextResponse.json(fallbackResult)

  } catch (error) {
    console.error("POST /api/products/search error:", error)
    return NextResponse.json({ matchedProductIds: [], intentSummary: "" }, { status: 500 })
  }
}
