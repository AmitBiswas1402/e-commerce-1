import { NextResponse } from "next/server"
import Razorpay from "razorpay"

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
const keySecret = process.env.RAZORPAY_KEY_SECRET || ""

export async function POST(req: Request) {
  try {
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay credentials not configured on server" }, { status: 500 })
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const body = await req.json()
    const { amount, currency = "INR", notes } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    }

    // Convert amount to paise (e.g. ₹500 -> 50000 paise)
    const amountInPaise = Math.round(Number(amount) * 100)

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `order_rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: notes || {},
    }

    const order = await instance.orders.create(options)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    })
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create Razorpay order" },
      { status: 500 }
    )
  }
}
