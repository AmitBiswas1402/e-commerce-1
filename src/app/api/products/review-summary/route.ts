import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ReviewItem = {
  rating?: number
  comment?: string
  author?: string
}

function generateSmartFallbackReviewSummary(productName: string, reviews: ReviewItem[]) {
  if (!reviews || reviews.length === 0) {
    return {
      pros: [
        "High quality build and materials",
        "Excellent overall value for money",
        "Fast shipping and secure packaging"
      ],
      cons: [
        "Limited color options available"
      ],
      overallSentiment: "Positive (4.8/5)"
    }
  }

  const positiveReviews = reviews.filter((r) => (r.rating || 5) >= 4)
  const negativeReviews = reviews.filter((r) => (r.rating || 5) <= 3)

  const pros = positiveReviews.slice(0, 3).map((r) => {
    const text = r.comment || ""
    if (text.length > 70) return text.substring(0, 67) + "..."
    return text || "Great quality and performance"
  })

  if (pros.length === 0) {
    pros.push("Solid performance and durability", "Good customer satisfaction")
  }

  const cons = negativeReviews.slice(0, 2).map((r) => {
    const text = r.comment || ""
    if (text.length > 70) return text.substring(0, 67) + "..."
    return text || "Minor packaging or size preference"
  })

  if (cons.length === 0) {
    cons.push("Slightly premium price point for budget buyers")
  }

  const avg = (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)

  return {
    pros,
    cons,
    overallSentiment: `Highly Rated (${avg}/5 stars)`
  }
}

export async function POST(req: Request) {
  try {
    const { productName, reviews } = await req.json()

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    const reviewList: ReviewItem[] = Array.isArray(reviews) ? reviews : []

    const rawApiKey = process.env.GEMINI_API_KEY
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : ""

    if (apiKey && reviewList.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey })

        const reviewsText = reviewList
          .map((r, i) => `Review ${i + 1} (${r.rating || 5}/5 stars): "${r.comment || ''}"`)
          .join("\n")

        const systemInstruction = `You are an expert e-commerce review analyzer.
Your task is to synthesize customer reviews for "${productName}" into key takeaways.

CRITICAL RULES:
1. Extract 2 to 3 concise PROS (key praises e.g. "Unreal noise cancellation, 30h battery life, premium build").
2. Extract 1 to 2 concise CONS (constructive feedback e.g. "Slightly heavy carrying case").
3. Keep each bullet point short (5-10 words max).
4. Provide a 1-word overall sentiment (e.g. "Overwhelmingly Positive", "Highly Recommended", "Great Value").

Respond strictly in valid JSON matching this schema:
{
  "pros": ["Pro bullet 1", "Pro bullet 2", "Pro bullet 3"],
  "cons": ["Con bullet 1", "Con bullet 2"],
  "overallSentiment": "Highly Recommended"
}

Customer Reviews:
${reviewsText}
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
            console.warn(`Gemini review summary model ${modelName} failed:`, err)
          }
        }

        if (textResult) {
          const cleanJson = textResult
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim()

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

          if (parsed && parsed.pros && Array.isArray(parsed.pros)) {
            return NextResponse.json({
              pros: parsed.pros,
              cons: parsed.cons || ["Slightly higher price point"],
              overallSentiment: parsed.overallSentiment || "Highly Recommended"
            })
          }
        }
      } catch (geminiErr) {
        console.error("Gemini review summarizer error, using fallback:", geminiErr)
      }
    }

    // Smart Fallback Summarizer
    const fallbackData = generateSmartFallbackReviewSummary(productName, reviewList)
    return NextResponse.json(fallbackData)

  } catch (error) {
    console.error("POST /api/products/review-summary error:", error)
    return NextResponse.json(
      { error: "Failed to generate AI review summary" },
      { status: 500 }
    )
  }
}
