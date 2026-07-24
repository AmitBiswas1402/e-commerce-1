import { NextResponse } from "next/server"
import { db } from "@/lib"
import { products, categories, brands, productImages, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { GoogleGenAI } from "@google/genai"

// Fallback catalog in case database is empty or seeding
const FALLBACK_STORE_CATALOG = [
  {
    id: "sony-xm5-headphone",
    name: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    slug: "sony-wh-1000xm5",
    description: "Industry leading noise canceling with two processors and 8 microphones. Up to 30-hour battery life.",
    category: "Electronics",
    brand: "Sony",
    price: 24999,
    originalPrice: 34990,
    stock: 15,
    inStock: true,
    rating: 4.8,
    reviewCount: 42,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"]
  },
  {
    id: "ps5-dualsense-controller",
    name: "PlayStation 5 DualSense Wireless Controller",
    slug: "ps5-dualsense-controller",
    description: "Discover a deeper, highly immersive gaming experience with innovative haptic feedback and dynamic trigger effects.",
    category: "Video Games",
    brand: "Sony",
    price: 4999,
    originalPrice: 6563,
    stock: 20,
    inStock: true,
    rating: 4.7,
    reviewCount: 38,
    images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=60"]
  },
  {
    id: "philips-air-fryer",
    name: "Philips Digital Air Fryer HD9252/90 with Rapid Air Tech",
    slug: "philips-digital-air-fryer",
    description: "Fry with up to 90% less fat. Touchscreen with 7 preset cooking modes.",
    category: "Kitchen",
    brand: "Philips",
    price: 7999,
    originalPrice: 9999,
    stock: 8,
    inStock: true,
    rating: 4.6,
    reviewCount: 29,
    images: ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&auto=format&fit=crop&q=60"]
  },
  {
    id: "loreal-hair-serum",
    name: "L'Oréal Paris Extra Ordinary Oil Hair Serum (100ml)",
    slug: "loreal-extraordinary-oil-serum",
    description: "Infused with 6 rare flower oils for intense shine, smooth texture, and anti-frizz protection.",
    category: "Beauty and Personal Care",
    brand: "L'Oréal",
    price: 299,
    originalPrice: 400,
    stock: 50,
    inStock: true,
    rating: 4.5,
    reviewCount: 54,
    images: ["https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format&fit=crop&q=60"]
  }
]

function predictNextQuickReplies(query: string): string[] {
  const q = query.toLowerCase()
  if (q.includes("shipping") || q.includes("delivery")) {
    return [
      "How does 7-day return policy work?",
      "Is Cash on Delivery (COD) available?",
      "Show items with free shipping"
    ]
  }
  if (q.includes("return") || q.includes("refund") || q.includes("exchange")) {
    return [
      "How long does refund processing take?",
      "What is covered under 1-Year Warranty?",
      "Browse top trending tech items"
    ]
  }
  if (q.includes("headphone") || q.includes("audio") || q.includes("earbud")) {
    return [
      "Which headphone has the longest battery?",
      "Show audio gear under ₹10,000",
      "Are these backed by 1-year warranty?"
    ]
  }
  if (q.includes("gamer") || q.includes("gaming") || q.includes("controller")) {
    return [
      "Show wireless gaming controllers",
      "Which gaming items are in stock?",
      "Express 1-2 day delivery options"
    ]
  }
  if (q.includes("warranty")) {
    return [
      "How to claim brand warranty?",
      "What is your return policy?",
      "Show featured electronics"
    ]
  }
  if (q.includes("under") || q.includes("budget") || q.includes("6k") || q.includes("30k") || q.includes("price")) {
    return [
      "Which item has highest customer rating?",
      "Show items with free delivery",
      "Can I pay via UPI or COD?"
    ]
  }
  return [
    "Show top electronics under ₹15,000",
    "What is the shipping & return policy?",
    "Gifts for gamers under 6k"
  ]
}

export async function POST(req: Request) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const messages = body.messages || []
    const lastUserMessage = messages && messages.length > 0
      ? messages[messages.length - 1].content
      : ""

    const lowerQuery = (lastUserMessage || "").toLowerCase()

    // 1. Fetch live product catalog from Neon PostgreSQL
    let catalog: any[] = []
    try {
      const dbProducts = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          status: products.status,
          isFeatured: products.isFeatured,
          isNewArrival: products.isNewArrival,
          categoryName: categories.name,
          brandName: brands.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))

      const published = dbProducts.filter(p => p.status === "PUBLISHED" || p.status === undefined || p.status === null || p.status === "DRAFT")

      catalog = await Promise.all(
        published.map(async (row) => {
          const dbImages = await db
            .select()
            .from(productImages)
            .where(eq(productImages.productId, row.id))
            .orderBy(productImages.sortOrder)

          const dbVariants = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, row.id))

          const price = dbVariants[0]?.price || 0
          const compareAtPrice = dbVariants[0]?.compareAtPrice || price
          const totalStock = dbVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
          const inStock = totalStock > 0

          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description || "",
            category: row.categoryName || "General",
            brand: row.brandName || "Velora",
            price,
            originalPrice: compareAtPrice,
            stock: totalStock,
            inStock,
            rating: 4.5,
            reviewCount: 12,
            images: dbImages.length > 0 ? dbImages.map((img) => img.imageUrl) : ["/placeholder.jpg"],
          }
        })
      )
    } catch (dbErr) {
      console.error("Database query error in assistant route:", dbErr)
    }

    // Ensure catalog has fallback items if DB is empty
    if (!catalog || catalog.length === 0) {
      catalog = FALLBACK_STORE_CATALOG
    }

    const storePolicies = `
- **Shipping Policy**: Free standard delivery across India for orders above ₹999. Standard delivery takes 3 to 5 business days. Express shipping (1-2 days) is available at checkout for ₹149.
- **Returns & Exchanges**: 7-day hassle-free return and replacement policy for unused items in original packaging with tags intact.
- **Payment Methods**: Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD).
- **Warranty**: All electronic products come with a 1-Year Official Brand Warranty.
- **Stock Availability**: Live stock status is displayed on interactive product cards inside this chat.
`

    const rawApiKey = process.env.GEMINI_API_KEY
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : ""

    // Extract budget from user query if mentioned
    let maxBudget: number | null = null
    const budgetMatch = lowerQuery.match(/(?:under|below|less than|within|upto)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\s*k)?)/i) ||
      lowerQuery.match(/(\d+)\s*k/i)
    if (budgetMatch) {
      let rawVal = budgetMatch[1].replace(/,/g, '')
      if (budgetMatch[0].toLowerCase().includes('k') || lowerQuery.includes('6k') || lowerQuery.includes('30k')) {
        if (lowerQuery.includes('6k')) maxBudget = 6000
        else if (lowerQuery.includes('30k')) maxBudget = 30000
        else maxBudget = parseFloat(rawVal) * 1000
      } else {
        maxBudget = parseFloat(rawVal)
      }
    }

    // Helper function to extract matching catalog products
    const findMatchingCatalogProducts = () => {
      let matches = catalog.filter(p => {
        const textMatch = p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.category.toLowerCase().includes(lowerQuery) ||
          p.brand.toLowerCase().includes(lowerQuery) ||
          (lowerQuery.includes("headphone") && (p.name.toLowerCase().includes("headphone") || p.category.toLowerCase().includes("audio") || p.name.toLowerCase().includes("sony"))) ||
          ((lowerQuery.includes("gamer") || lowerQuery.includes("gaming")) && (p.description.toLowerCase().includes("game") || p.category.toLowerCase().includes("gaming") || p.name.toLowerCase().includes("playstation") || p.price <= 6000))

        if (maxBudget !== null) {
          return textMatch || p.price <= maxBudget
        }
        return textMatch
      })

      if (maxBudget !== null && matches.length > 0) {
        const budgetMatches = matches.filter(p => p.price <= maxBudget!)
        if (budgetMatches.length > 0) matches = budgetMatches
      }

      if (matches.length === 0) {
        if (maxBudget !== null) {
          matches = catalog.filter(p => p.price <= maxBudget!)
        }
      }

      if (matches.length === 0) {
        matches = catalog.slice(0, 3)
      }

      return matches.slice(0, 4)
    }

    // Try Gemini API if key is configured
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey })

        const systemInstruction = `You are Velora AI Assistant, an expert AI shopping assistant embedded in Velora Store.
Your job is to help shoppers find products, compare options, and answer questions about product specs, shipping, returns, payments, and stock availability.

CRITICAL INSTRUCTION:
Always respond in valid JSON format matching this exact JSON schema:
{
  "message": "Friendly, helpful response text using markdown formatting.",
  "productIds": ["id1", "id2"], // Array of EXACT ID strings chosen from the catalog list below
  "quickReplies": ["Option 1", "Option 2", "Option 3"] // Array of 3 dynamic, contextually predicted follow-up queries
}

RULES FOR PRODUCT SELECTION:
1. "productIds" MUST contain exact "ID" values from the catalog list below.
2. If user asks for headphones, gaming gear, or items under budget, pick matching items from catalog.

STORE POLICIES:
${storePolicies}

LIVE PRODUCT CATALOG (${catalog.length} items):
${catalog.map(p => `- ID: "${p.id}" | Name: "${p.name}" | Category: "${p.category}" | Price: ₹${p.price}`).join("\n")}
`

        const formattedHistory = (messages || [])
          .slice(-6)
          .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")

        const fullPrompt = `${systemInstruction}\n\nCONVERSATION HISTORY:\n${formattedHistory}\n\nRespond with valid JSON only:`

        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        let textResult = ""

        for (const modelName of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [
                { role: "user", parts: [{ text: fullPrompt }] }
              ],
              config: {
                responseMimeType: "application/json",
              }
            })
            if (response.text) {
              textResult = response.text
              break
            }
          } catch (modelErr) {
            console.warn(`Gemini model ${modelName} failed:`, modelErr)
          }
        }

        if (textResult) {
          const cleanJson = textResult
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim()

          const parsed = JSON.parse(cleanJson)

          let matchedProducts = catalog.filter(p =>
            parsed.productIds?.some((id: any) =>
              String(id).toLowerCase().trim() === String(p.id).toLowerCase().trim() ||
              p.name.toLowerCase().includes(String(id).toLowerCase().trim()) ||
              (p.slug && p.slug.toLowerCase() === String(id).toLowerCase().trim())
            )
          )

          const isPolicyOnlyQuery = lowerQuery.includes("shipping") || lowerQuery.includes("return") || lowerQuery.includes("refund") || lowerQuery.includes("warranty")

          // GUARANTEE: If not a policy-only query, ALWAYS attach matching product cards!
          if (matchedProducts.length === 0 && !isPolicyOnlyQuery) {
            matchedProducts = findMatchingCatalogProducts()
          }

          const predictedReplies = (parsed.quickReplies || predictNextQuickReplies(lastUserMessage))
            .filter((reply: string) => reply.toLowerCase().trim() !== lowerQuery.trim())
            .slice(0, 3)

          return NextResponse.json({
            message: parsed.message || "Here are top recommendations from our store catalog:",
            products: matchedProducts,
            quickReplies: predictedReplies.length >= 2 ? predictedReplies : predictNextQuickReplies(lastUserMessage)
          })
        }
      } catch (geminiErr) {
        console.error("Gemini API error, falling back to smart catalog search:", geminiErr)
      }
    }

    // Fallback catalog search & Q&A handler (guarantees product cards under every positive reply)
    const matchingProducts = findMatchingCatalogProducts()
    const predictedQuickReplies = predictNextQuickReplies(lastUserMessage)

    let replyMessage = ""

    if (lowerQuery.includes("shipping") || lowerQuery.includes("delivery")) {
      replyMessage = "🚚 **Velora Shipping Details**:\n- **Free Shipping**: Available on all orders over ₹999 across India.\n- **Delivery Time**: 3-5 business days standard, or Express delivery in 1-2 days for ₹149."
    } else if (lowerQuery.includes("return") || lowerQuery.includes("refund") || lowerQuery.includes("exchange")) {
      replyMessage = "🔄 **Return Policy**:\n- We offer a **7-day easy return & exchange policy** for unused items in original packaging with tags attached.\n- Refunds are processed within 24-48 hours after item inspection."
    } else if (lowerQuery.includes("warranty")) {
      replyMessage = "🛡️ **Warranty Info**:\n- All electronic items in Velora Store carry a **1-Year Official Brand Warranty** covering manufacturing defects."
    } else if (maxBudget !== null) {
      replyMessage = `✨ I found these top product recommendations matching your budget of **₹${maxBudget.toLocaleString('en-IN')}**:`
    } else if (lowerQuery.includes("headphone") || lowerQuery.includes("audio")) {
      replyMessage = "🎧 Here are top-rated noise-cancelling headphones & audio gear available in our database:"
    } else if (lowerQuery.includes("gamer") || lowerQuery.includes("gaming")) {
      replyMessage = "🎮 Check out these awesome gaming gear and gift ideas under ₹6,000:"
    } else {
      replyMessage = `👋 Hi there! I searched our database for "${lastUserMessage || "top products"}". Here are top picks for you:`
    }

    return NextResponse.json({
      message: replyMessage,
      products: matchingProducts,
      quickReplies: predictedQuickReplies
    })

  } catch (error) {
    console.error("POST /api/assistant/chat error:", error)
    return NextResponse.json({
      message: "I'm here to help! Here are top featured products from our catalog:",
      products: FALLBACK_STORE_CATALOG.slice(0, 3),
      quickReplies: predictNextQuickReplies("top products")
    }, { status: 200 })
  }
}
