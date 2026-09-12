"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { Package, RefreshCw, ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MyOrderItem {
  id: string
  productId: string | null
  productName: string
  variantName: string | null
  sku: string
  unitPrice: number
  quantity: number
  totalPrice: number
  image: string
}

interface MyOrder {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  subtotal: number
  shippingAmount: number
  discountAmount: number
  totalAmount: number
  shippingFullName: string
  shippingAddressLine1: string
  shippingCity: string
  shippingState: string
  createdAt: string
  items: MyOrderItem[]
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  CONFIRMED: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
  PROCESSING: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  SHIPPED: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
  OUT_FOR_DELIVERY: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
}

export default function MyOrdersPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to load orders:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOrders()
    } else if (isLoaded) {
      setLoading(false)
    }
  }, [isLoaded, isSignedIn])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Store
            </Link>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-2 flex items-center gap-2">
              <Package className="size-7 text-indigo-500" />
              My Orders
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Track and review your purchase history.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
            <Package className="size-12 text-zinc-300 dark:text-zinc-700" />
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No orders yet
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              When you place an order, it will show up here.
            </p>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                      #{order.orderNumber}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                        STATUS_BADGE[order.status] || STATUS_BADGE.PENDING
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative size-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.productName}
                            {item.variantName ? ` (${item.variantName})` : ""}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0">
                          ₹{item.totalPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs space-y-1.5 text-zinc-500 dark:text-zinc-400 sm:border-l sm:border-zinc-100 dark:sm:border-zinc-800 sm:pl-4">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="size-3.5 text-indigo-500 mt-0.5" />
                      <span>
                        {order.shippingFullName}, {order.shippingAddressLine1}, {order.shippingCity},{" "}
                        {order.shippingState}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span>Subtotal</span>
                      <span className="text-zinc-800 dark:text-zinc-200">
                        ₹{order.subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-zinc-800 dark:text-zinc-200">
                        {order.shippingAmount === 0
                          ? "FREE"
                          : `₹${order.shippingAmount.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 text-sm font-black text-zinc-900 dark:text-zinc-50">
                      <span>Total</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}