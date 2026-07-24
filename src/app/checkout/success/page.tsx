"use client"

import React, { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, ShoppingBag, Printer, ArrowRight, ShieldCheck, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderItem {
  id: string | number
  name: string
  price: number
  quantity: number
  image: string
}

interface SavedOrderData {
  paymentId: string
  orderId: string
  amount: number
  subtotal: number
  discount: number
  shipping: number
  tax: number
  items: OrderItem[]
  date: string
  email?: string
  name?: string
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<SavedOrderData | null>(null)
  const [copiedPaymentId, setCopiedPaymentId] = useState(false)
  const [copiedOrderId, setCopiedOrderId] = useState(false)

  const queryPaymentId = searchParams.get("payment_id") || searchParams.get("razorpay_payment_id")
  const queryOrderId = searchParams.get("order_id") || searchParams.get("razorpay_order_id")

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("velora_last_order")
      if (stored) {
        setOrder(JSON.parse(stored))
      }
    } catch (err) {
      console.error("Failed to read order details from storage", err)
    }
  }, [])

  const paymentId = order?.paymentId || queryPaymentId || "pay_demo_success_123"
  const orderId = order?.orderId || queryOrderId || "order_demo_success_123"
  const totalAmount = order?.amount || 0
  const orderDate = order?.date || new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const copyToClipboard = (text: string, type: "payment" | "order") => {
    navigator.clipboard.writeText(text)
    if (type === "payment") {
      setCopiedPaymentId(true)
      setTimeout(() => setCopiedPaymentId(false), 2000)
    } else {
      setCopiedOrderId(true)
      setTimeout(() => setCopiedOrderId(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        
        {/* Celebration Banner */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex relative items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="size-10" />
            </div>
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold tracking-wide uppercase">
            Razorpay Verified Payment
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            Order Confirmed & Paid!
          </h1>
          
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Thank you for shopping with <strong className="text-zinc-800 dark:text-zinc-200">Velora Market</strong>. We have received your payment and your order is now being processed.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 mb-6">
          
          {/* Reference Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Razorpay Payment ID</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{paymentId}</span>
                <button
                  onClick={() => copyToClipboard(paymentId, "payment")}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                  title="Copy Payment ID"
                >
                  {copiedPaymentId ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Order Reference</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{orderId}</span>
                <button
                  onClick={() => copyToClipboard(orderId, "order")}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                  title="Copy Order ID"
                >
                  {copiedOrderId ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Date & Time</p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{orderDate}</p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Payment Method</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" /> Razorpay Instant Gateway
              </span>
            </div>
          </div>

          {/* Purchased Items List */}
          {order?.items && order.items.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <ShoppingBag className="size-4 text-indigo-500" />
                Items Purchased ({order.items.length})
              </h3>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <div className="relative size-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                        <p className="text-[11px] text-zinc-400">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amount Breakdown */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            {order?.subtotal !== undefined && (
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            {order?.discount ? (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount Applied</span>
                <span>-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            ) : null}
            {order?.shipping !== undefined && (
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
              </div>
            )}
            {order?.tax !== undefined && (
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{order.tax.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 flex items-baseline justify-between text-sm font-bold text-zinc-900 dark:text-zinc-50">
              <span>Total Amount Paid</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="rounded-xl gap-2 font-semibold text-xs py-5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Printer className="size-4" /> Print Receipt
          </Button>

          <Link href="/">
            <Button className="w-full sm:w-auto rounded-xl gap-2 font-bold text-xs py-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 dark:shadow-none">
              <span>Continue Shopping</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
