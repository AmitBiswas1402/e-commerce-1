"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Percent, ShieldCheck } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { slugify } from "@/lib/slug"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartSubtotal, cartCount } = useCart()
  const [mounted, setMounted] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError] = useState("")
  const [couponSuccess, setCouponSuccess] = useState("")

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your shopping cart...</p>
        </div>
      </div>
    )
  }

  const shipping = cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 99
  const tax = Math.round(cartSubtotal * 0.05) // 5% GST
  const total = cartSubtotal - discountAmount + shipping + tax

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError("")
    setCouponSuccess("")
    
    if (couponCode.toUpperCase() === "VELORA10") {
      const discount = Math.round(cartSubtotal * 0.1)
      setDiscountAmount(discount)
      setCouponSuccess(`Success! 10% discount applied: -₹${discount.toLocaleString("en-IN")}`)
    } else if (couponCode.trim() === "") {
      setCouponError("Please enter a coupon code.")
    } else {
      setCouponError("Invalid coupon code. Try 'VELORA10'")
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[75vh] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner">
          <ShoppingBag className="size-10" />
          <div className="absolute -top-1 -right-1 flex h-6 w-6 animate-ping rounded-full bg-indigo-400 opacity-20" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
          Your Cart is Empty
        </h1>
        <p className="max-w-md text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Looks like you haven't added anything to your cart yet. Explore our featured collections to find premium items!
        </p>
        <Link href="/">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-5 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150">
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">
          Shopping Cart <span className="text-lg font-medium text-zinc-400">({cartCount} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT: Items List (8 Cols) ────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => {
              const discountPercent = Math.round(
                ((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100
              )
              return (
                <div
                  key={item.product.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm"
                >
                  {/* Image wrapper */}
                  <div className="relative w-full sm:w-28 aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    <Link href={`/${slugify(item.product.name)}`} className="absolute inset-0 block">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 112px"
                        className="object-cover"
                      />
                    </Link>
                  </div>

                  {/* Item info */}
                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="inline-block rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                          {item.product.category}
                        </span>
                        <Link href={`/${slugify(item.product.name)}`}>
                          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 leading-snug line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                          {item.product.description}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="px-3 py-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Pricing */}
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            (₹{item.product.price.toLocaleString("en-IN")} each)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── RIGHT: Summary Card (4 Cols) ─────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Promo code */}
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-1.5">
                <Percent className="size-4 text-indigo-500" /> Apply Coupon Code
              </h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. VELORA10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                />
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow transition-all duration-150"
                >
                  Apply
                </Button>
              </form>
              {couponError && <p className="text-[10px] text-red-500 font-medium mt-2">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold mt-2">{couponSuccess}</p>}
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-zinc-800 dark:text-zinc-200">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE</span>
                  ) : (
                    <span className="text-zinc-800 dark:text-zinc-200">₹{shipping.toLocaleString("en-IN")}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (5%)</span>
                  <span className="text-zinc-800 dark:text-zinc-200">₹{tax.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="my-5 border-t border-zinc-100 dark:border-zinc-800" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Grand Total</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Checkout Button */}
              <Button className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl py-6 font-semibold flex items-center justify-center gap-2 group transition-all duration-150 hover:-translate-y-0.5 shadow-md shadow-indigo-100 dark:shadow-none">
                Proceed to Checkout
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Trust statement */}
              <div className="flex items-center gap-2 mt-4 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                <ShieldCheck className="size-4 text-emerald-500 flex-shrink-0" />
                <span>100% Safe Payments. Verified secure transactions.</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}