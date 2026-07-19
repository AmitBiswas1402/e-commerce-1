"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, ShoppingCart, Heart, ArrowRight } from "lucide-react"
import { useWishlist } from "@/context/WishlistContext"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { slugify } from "@/lib/slug"

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [mounted, setMounted] = useState(false)
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your wishlist...</p>
        </div>
      </div>
    )
  }

  const handleAddToCart = (product: any) => {
    setAddingToCartId(product.id)
    addToCart(product)
    setTimeout(() => {
      setAddingToCartId(null)
    }, 1000)
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[75vh] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 mb-6 shadow-inner">
          <Heart className="size-10 fill-rose-500/10" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
          Your Wishlist is Empty
        </h1>
        <p className="max-w-md text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Keep track of items you love by clicking the heart icon on any product card.
        </p>
        <Link href="/">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-5 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150">
            Discover Products
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
          My Wishlist <span className="text-lg font-medium text-zinc-400">({wishlist.length} items)</span>
        </h1>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const discount = Math.round(
              ((product.originalPrice - product.price) / product.originalPrice) * 100
            )
            return (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-2xl overflow-hidden border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Image Area */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <Link href={`/${slugify(product.name)}`} className="absolute inset-0 block">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                  </Link>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 shadow backdrop-blur-sm hover:text-red-500 dark:hover:text-red-400 hover:scale-110 active:scale-95 transition-all duration-200"
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  
                  {/* Out of stock overlay */}
                  {!product.inStock && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                      <span className="rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-white">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="w-fit rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                    {product.category}
                  </span>
                  
                  <Link href={`/${slugify(product.name)}`}>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 leading-snug line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-baseline gap-2 mt-auto pt-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-zinc-400 line-through">
                      ₹{product.originalPrice.toLocaleString("en-IN")}
                    </span>
                    {discount > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {discount}% off
                      </span>
                    )}
                  </div>

                  {/* Add to Cart CTA */}
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <ShoppingCart className="size-3.5" />
                    {addingToCartId === product.id ? "Added!" : product.inStock ? "Add to Cart" : "Unavailable"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}