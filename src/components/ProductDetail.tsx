"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
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
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  Send,
  RefreshCw,
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
  const { user } = useUser();
  const [activeImg, setActiveImg] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  // Dynamic Reviews & Rating States
  const [reviewsList, setReviewsList] = useState(product.reviews || []);
  const [ratingAvg, setRatingAvg] = useState(product.rating || 4.5);
  const [reviewCount, setReviewCount] = useState(product.reviewCount || product.reviews?.length || 1);

  // AI Review Summarizer States
  const [aiHighlights, setAiHighlights] = useState<{
    pros: string[];
    cons: string[];
    overallSentiment: string;
  } | null>(null);
  const [loadingAiHighlights, setLoadingAiHighlights] = useState(false);

  // Review Submission States
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newAuthor, setNewAuthor] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Pre-fill author name if Clerk user signed in
  useEffect(() => {
    if (user?.fullName && !newAuthor) {
      setNewAuthor(user.fullName);
    }
  }, [user, newAuthor]);

  // Fetch AI Review Summary
  const fetchAiReviewSummary = async (customReviews = reviewsList) => {
    setLoadingAiHighlights(true);
    try {
      const res = await fetch("/api/products/review-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          reviews: customReviews,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiHighlights(data);
      }
    } catch (err) {
      console.error("Failed to fetch AI review summary:", err);
    } finally {
      setLoadingAiHighlights(false);
    }
  };

  useEffect(() => {
    fetchAiReviewSummary(product.reviews);
  }, [product.id]);

  // Handle New Review Submission
  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    const authorName = newAuthor.trim() || user?.fullName || "Verified Buyer";
    const dateStr = new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    const userAvatar = user?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";

    const newReview = {
      author: authorName,
      rating: newRating,
      comment: newComment.trim(),
      date: dateStr,
      verified: true,
      avatar: userAvatar,
    };

    const updatedList = [newReview, ...reviewsList];
    setReviewsList(updatedList);

    // Recalculate Average & Count
    const totalRatingSum = updatedList.reduce((acc, r) => acc + r.rating, 0);
    const newAvg = Number((totalRatingSum / updatedList.length).toFixed(1));
    setRatingAvg(newAvg);
    setReviewCount(updatedList.length);

    setNewComment("");
    setNewRating(5);
    setIsWriteReviewOpen(false);
    setIsSubmittingReview(false);

    // Re-trigger AI Review Summarizer for real-time synthesis
    fetchAiReviewSummary(updatedList);
  };

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
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-lg group">
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-4 sm:p-6 transition-all duration-500 hover:scale-105"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 shadow backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-5 text-zinc-700 dark:text-zinc-300" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 shadow backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
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
                        i === activeImg ? "w-5 bg-indigo-500" : "w-2 bg-zinc-400/60"
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
                      "relative w-20 h-20 rounded-xl overflow-hidden border-2 bg-white dark:bg-zinc-900 flex-shrink-0 transition-all duration-150 cursor-pointer",
                      i === activeImg
                        ? "border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30"
                        : "border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                    aria-label={`Thumbnail ${i + 1}`}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill sizes="80px" className="object-contain p-1.5" />
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
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Customer Reviews</h2>
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                {reviewsList.length} reviews
              </span>
            </div>
            <button
              onClick={() => setIsWriteReviewOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-200/50 dark:shadow-none transition-all active:scale-95 cursor-pointer"
            >
              <MessageSquarePlus className="size-4" />
              {isWriteReviewOpen ? "Close Form" : "Write a Review"}
            </button>
          </div>

          {/* ── AI Review Highlights Box ── */}
          <div className="mb-8 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-indigo-950/40 p-6 shadow-md shadow-indigo-100/50 dark:shadow-none relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm">
                  <Sparkles className="size-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                      AI Review Highlights
                    </h3>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                      ✨ Powered by Gemini
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Synthesized key customer feedback & pros/cons</p>
                </div>
              </div>
              {aiHighlights?.overallSentiment && (
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1 text-xs font-bold">
                  {aiHighlights.overallSentiment}
                </span>
              )}
            </div>

            {loadingAiHighlights ? (
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 py-4 animate-pulse font-medium">
                <RefreshCw className="size-4 animate-spin" />
                <span>Analyzing customer reviews with Gemini AI...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* PROS */}
                <div className="rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <ThumbsUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Pros & Praises</span>
                  </div>
                  <ul className="space-y-1.5">
                    {aiHighlights?.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>&ldquo;{pro}&rdquo;</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CONS */}
                <div className="rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <ThumbsDown className="size-4 text-amber-600 dark:text-amber-400" />
                    <span>Cons & Considerations</span>
                  </div>
                  <ul className="space-y-1.5">
                    {aiHighlights?.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                        <AlertCircle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>&ldquo;{con}&rdquo;</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ── Write a Review Form Card ── */}
          {isWriteReviewOpen && (
            <form onSubmit={handlePostReview} className="mb-8 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <MessageSquarePlus className="size-4 text-indigo-500" />
                  Write a Customer Review
                </h3>
                <span className="text-[11px] text-zinc-400">Verified Reviewer</span>
              </div>

              {/* Star Rating Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Overall Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-hidden cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "size-6 transition-transform hover:scale-110",
                          (hoverRating || newRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-300 dark:text-zinc-700"
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-500">
                    {(hoverRating || newRating)} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Author & Comment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Review Feedback</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share what you loved or your constructive feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsWriteReviewOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="size-3.5" />
                  {isSubmittingReview ? "Posting..." : "Submit Review"}
                </button>
              </div>
            </form>
          )}

          {/* Rating summary */}
          <div className="flex items-center gap-6 mb-8 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm w-fit">
            <div className="flex flex-col items-center gap-1">
              <span className="text-5xl font-extrabold text-zinc-900 dark:text-zinc-50">{ratingAvg.toFixed(1)}</span>
              <StarRating rating={ratingAvg} size="lg" />
              <span className="text-xs text-zinc-400">{reviewCount.toLocaleString("en-IN")} ratings</span>
            </div>
          </div>

          {/* Review cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewsList.map((review, idx) => (
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
