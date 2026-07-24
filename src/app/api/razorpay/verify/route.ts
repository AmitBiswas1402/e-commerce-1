import { NextResponse } from "next/server"
import crypto from "crypto"

const keySecret = process.env.RAZORPAY_KEY_SECRET || ""

export async function POST(req: Request) {
  try {
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay secret key not configured on server" }, { status: 500 })
    }

    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required Razorpay payment signature parameters" }, { status: 400 })
    }

    // Verify signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json({ error: "Invalid payment signature verification failed" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    })
  } catch (error: any) {
    console.error("Razorpay Verify Payment Error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to verify Razorpay payment" },
      { status: 500 }
    )
  }
}
