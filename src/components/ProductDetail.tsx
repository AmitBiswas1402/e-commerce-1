"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  StarHalf,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  BadgeCheck,
  Package,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

// ─── Category Colors ─────────
const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Fashion: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  Apparel: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Kitchen: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Home and Furniture": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Beauty and Personal Care": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Sports and Outdoors": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Gym and Fitness": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Books and Stationery": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "Video Games": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const BADGE_COLORS: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Top Rated": "bg-emerald-500 text-white",
  "Hot Deal": "bg-red-500 text-white",
  New: "bg-blue-500 text-white",
  "50% Off": "bg-pink-500 text-white",
  "40% Off": "bg-indigo-500 text-white",
};

// ─── Star Rating ──────────
function StarRating({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "lg" }) {
  const starSize = size === "lg" ? "size-5" : "size-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return filled ? (
          <Star key={i} className={cn(starSize, "fill-amber-400 text-amber-400")} />
        ) : half ? (
          <StarHalf key={i} className={cn(starSize, "fill-amber-400 text-amber-400")} />
        ) : (
          <Star key={i} className={cn(starSize, "text-zinc-300 dark:text-zinc-600")} />
        );
      })}
    </div>
  );
}

// ─── ProductDetail Client Component ────────────
export default function ProductDetail({ product }: { product: Product }) {
  const [activeImg, setActiveImg] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );
  const categoryColor =
    CATEGORY_COLORS[product.category] ??
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  const badgeColor = product.badge
    ? (BADGE_COLORS[product.badge] ?? "bg-zinc-800 text-white")
    : "";

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const prevImg = () =>
    setActiveImg((prev) => (prev - 1 + product.images.length) % product.images.length);
  const nextImg = () =>
    setActiveImg((prev) => (prev + 1) % product.images.length);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mb-6" aria-label="breadcrumb">
          <Link href="/" className="hover:text-indigo-500 transition-colors">Home</Link>
          <span>/</span>
          <span className="hover:text-indigo-500 transition-colors cursor-pointer">{product.category}</span>
          <span>/</span>
          <span className="text-zinc-700 dark:text-zinc-300 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* ── Back Link ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mb-6 text-sm font-medium text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to products
        </Link>

        {/* ─ Main Grid ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* ── LEFT: Image Gallery ─── */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-lg group">
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-all duration-500"
                priority
              />
              {product.badge && (
                <span className={cn("absolute top-4 left-4 z-10 rounded-full px-3 py-1 text-xs font-bold tracking-wide shadow", badgeColor)}>
                  {product.badge}
                </span>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <span className="rounded-full bg-zinc-900/80 px-4 py-1.5 text-sm font-semibold text-white">
                    Out of Stock
                  </span>
                </div>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 shadow backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-5 text-zinc-700 dark:text-zinc-300" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 shadow backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-5 text-zinc-700 dark:text-zinc-300" />
                  </button>
                </>
              )}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        i === activeImg ? "w-5 bg-indigo-500" : "w-2 bg-white/60"
                      )}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-150",
                      i === activeImg
                        ? "border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                    aria-label={`Thumbnail ${i + 1}`}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Details ──────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", categoryColor)}>
                {product.category}
              </span>
              {product.badge && (
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", badgeColor)}>
                  {product.badge}
                </span>
              )}
              {product.inStock ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="size-3.5" /> In Stock
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-500">Out of Stock</span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 flex-wrap">
              <StarRating rating={product.rating} size="lg" />
              <span className="text-lg font-bold text-amber-500">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-zinc-400 dark:text-zinc-500">
                {product.reviewCount.toLocaleString("en-IN")} ratings
              </span>
            </div>

            {/* Price block */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <span className="text-lg text-zinc-400 line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
              {discount > 0 && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-sm font-bold">
                  {discount}% off
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Inclusive of all taxes. Free delivery on orders above ₹499.</p>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Description */}
            <div>
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">About this item</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Qty:</span>
              <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-bold"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50 border-x border-zinc-200 dark:border-zinc-700 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-bold"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={cn(
                  "flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all duration-200 active:scale-95 shadow-sm",
                  product.inStock
                    ? addedToCart
                      ? "bg-emerald-500 text-white shadow-emerald-200 dark:shadow-emerald-900/30"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900/30"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                )}
              >
                <ShoppingCart className="size-4" />
                {addedToCart ? "Added to Cart!" : product.inStock ? "Add to Cart" : "Unavailable"}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold border transition-all duration-200 active:scale-95",
                  wishlisted
                    ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                )}
              >
                <Heart className={cn("size-4", wishlisted ? "fill-rose-500 text-rose-500" : "fill-none")} />
                {wishlisted ? "Wishlisted" : "Wishlist"}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { icon: Truck, label: "Free Delivery", sub: "On orders above ₹499" },
                { icon: RotateCcw, label: "Easy Returns", sub: "7-day return policy" },
                { icon: Shield, label: "Secure Payment", sub: "100% safe checkout" },
                { icon: BadgeCheck, label: "Genuine Product", sub: "Verified & authentic" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                    <Icon className="size-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Reviews Section ─────────────────────────────────────────────── */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Customer Reviews</h2>
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {product.reviews.length} reviews
            </span>
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-6 mb-8 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm w-fit">
            <div className="flex flex-col items-center gap-1">
              <span className="text-5xl font-extrabold text-zinc-900 dark:text-zinc-50">{product.rating.toFixed(1)}</span>
              <StarRating rating={product.rating} size="lg" />
              <span className="text-xs text-zinc-400">{product.reviewCount.toLocaleString("en-IN")} ratings</span>
            </div>
          </div>

          {/* Review cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.reviews.map((review, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={review.avatar}
                    alt={review.author}
                    width={40}
                    height={40}
                    className="rounded-full size-10 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{review.author}</span>
                      {review.verified && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          <BadgeCheck className="size-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{review.date}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Not found state (also client since it needs Link) ──────────────────────
export function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <Package className="size-16 text-zinc-300 dark:text-zinc-700" />
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">Product Not Found</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
        We couldn&apos;t find the product you&apos;re looking for. It may have been removed or the link is invalid.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Products
      </Link>
    </div>
  );
}
