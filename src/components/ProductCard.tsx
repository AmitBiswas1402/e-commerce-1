"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Heart, ShoppingCart, Star, StarHalf, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";

// ─── Category Badge Colors ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Electronics:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Fashion:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  Apparel:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Kitchen:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Home and Furniture":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Beauty and Personal Care":
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Sports and Outdoors":
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Gym and Fitness":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Books and Stationery":
    "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "Video Games":
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

// ─── Badge Colors ────────────────────────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Top Rated": "bg-emerald-500 text-white",
  "Hot Deal": "bg-red-500 text-white",
  New: "bg-blue-500 text-white",
  "50% Off": "bg-pink-500 text-white",
  "40% Off": "bg-indigo-500 text-white",
};

// ─── Star Rating Renderer ────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return filled ? (
          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
        ) : half ? (
          <StarHalf key={i} className="size-3.5 fill-amber-400 text-amber-400" />
        ) : (
          <Star key={i} className="size-3.5 text-zinc-300 dark:text-zinc-600" />
        );
      })}
    </div>
  );
}

// ─── ProductCard ─────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const categoryColor =
    CATEGORY_COLORS[product.category] ??
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

  const badgeColor =
    product.badge ? (BADGE_COLORS[product.badge] ?? "bg-zinc-800 text-white") : "";

  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImg((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImg((prev) => (prev + 1) % product.images.length);
  };

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* ── Image Area ──────────────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {/* Main Image */}
        <Image
          src={product.images[activeImg]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={false}
        />

        {/* Gradient overlay for controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Prev / Next arrows */}
        {product.images.length > 1 && (
          <>
            <button
              onClick={handlePrevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex size-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/50 active:scale-90"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={handleNextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex size-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/50 active:scale-90"
              aria-label="Next image"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}

        {/* Image dots indicator */}
        {product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                className={cn(
                  "h-1 rounded-full transition-all duration-200",
                  i === activeImg ? "w-4 bg-white" : "w-1.5 bg-white/50"
                )}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Badge (top-left) */}
        {product.badge && (
          <span
            className={cn(
              "absolute top-2.5 left-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide shadow-sm",
              badgeColor
            )}
          >
            {product.badge}
          </span>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist button (top-right) */}
        <button
          onClick={(e) => { e.stopPropagation(); setWishlisted((w) => !w); }}
          className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 shadow backdrop-blur-sm hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              wishlisted ? "fill-rose-500 text-rose-500" : "fill-none"
            )}
          />
        </button>

        {/* Thumbnail strip */}
        {product.images.length > 1 && (
          <div className="absolute bottom-0 inset-x-0 px-3 pb-6 pt-1 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        )}
      </div>

      {/* ── Thumbnail Picker ─────────────────────────────────────────── */}
      {product.images.length > 1 && (
        <div className="flex gap-1.5 px-3 pt-2.5">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={cn(
                "relative w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-150",
                i === activeImg
                  ? "border-indigo-500 dark:border-indigo-400"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
              aria-label={`Thumbnail ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${product.name} view ${i + 1}`}
                fill
                sizes="40px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Card Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 p-3 pt-2.5">
        {/* Category badge */}
        <span
          className={cn(
            "w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold",
            categoryColor
          )}
        >
          {product.category}
        </span>

        {/* Name */}
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Rating row */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={product.rating} />
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            ({product.reviewCount.toLocaleString("en-IN")})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-zinc-400 line-through">
            ₹{product.originalPrice.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {discount}% off
            </span>
          )}
        </div>

        {/* Reviews preview */}
        {product.reviews.length > 0 && (
          <div className="mt-1 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2">
            <div className="flex items-start gap-2">
              <Image
                src={product.reviews[0].avatar}
                alt={product.reviews[0].author}
                width={24}
                height={24}
                className="rounded-full flex-shrink-0 mt-0.5 size-6 object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                    {product.reviews[0].author}
                  </span>
                  {product.reviews[0].verified && (
                    <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  &ldquo;{product.reviews[0].comment}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95",
              product.inStock
                ? addedToCart
                  ? "bg-emerald-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            )}
          >
            <ShoppingCart className="size-3.5" />
            {addedToCart ? "Added!" : product.inStock ? "Add to Cart" : "Unavailable"}
          </button>
          <button
            onClick={() => setWishlisted((w) => !w)}
            className={cn(
              "flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all duration-200 active:scale-95",
              wishlisted
                ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
            aria-label="Wishlist"
          >
            <Heart
              className={cn(
                "size-3.5",
                wishlisted ? "fill-rose-500 text-rose-500" : "fill-none"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}