"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, SearchX } from "lucide-react";
import { type Product } from "@/lib/products";
import ProductCard from "./ProductCard";

// ── Inner component that uses useSearchParams ──────────────────────────────
function FeaturingContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";
  const query = rawQuery.trim().toLowerCase();

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setProductsList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load products via REST API:", err);
        setProductsList([]);
        setLoading(false);
      });
  }, []);

  const filtered = query
    ? productsList.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    : productsList;

  if (loading) {
    return (
      <div className="w-full py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <section className="w-full py-10">
      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-indigo-500" />
            <span className="text-xs font-semibold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
              {query ? `Results for "${rawQuery}"` : "Handpicked for you"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {query ? "Search Results" : "Featured Products"}
          </h2>
          {!query && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
              Explore our curated selection of top-rated products across categories — from electronics to fitness.
            </p>
          )}
          {query && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Found <span className="font-semibold text-zinc-700 dark:text-zinc-300">{filtered.length}</span> product{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {!query && (
          <Link
            href="#"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all duration-200 group"
            aria-label="View all featured products"
          >
            View All
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* ── Empty State ──────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <SearchX className="size-12 text-zinc-300 dark:text-zinc-700" />
          <div className="text-center">
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No results for &ldquo;{rawQuery}&rdquo;
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Try a different search term or browse all products.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Browse all products
          </Link>
        </div>
      )}

      {/* ── Products Grid ────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* ── Mobile "View All" link ───────────────────────────────────── */}
      {!query && filtered.length > 0 && (
        <div className="mt-6 flex sm:hidden justify-center">
          <Link
            href="#"
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full px-5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            View All Products
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

// ── Exported default with Suspense boundary ────────────────────────────────
export default function Featuring() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse"
            />
          ))}
        </div>
      }
    >
      <FeaturingContent />
    </Suspense>
  );
}