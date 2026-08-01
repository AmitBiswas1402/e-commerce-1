"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, SearchX } from "lucide-react";
import { type Product } from "@/lib/products";
import ProductCard from "./ProductCard";

function isCategoryMatch(productCategory: string, filterCategory: string, productName: string = ""): boolean {
  if (!filterCategory || !filterCategory.trim()) return true;

  const pCat = (productCategory || "").toLowerCase().trim();
  const fCat = filterCategory.toLowerCase().trim();
  const pName = (productName || "").toLowerCase().trim();

  // Exact or substring match
  if (pCat === fCat || (pCat && fCat.includes(pCat)) || (pCat && pCat.includes(fCat))) return true;

  // Category specific synonym mappings:
  if (fCat.includes("book") || fCat.includes("stationery")) {
    return pCat.includes("book") || pCat.includes("stationery") || pName.includes("book") || pName.includes("habit") || pName.includes("psychology") || pName.includes("novel");
  }

  if (fCat.includes("electronics")) {
    return pCat.includes("electronic") || pCat.includes("tech") || pName.includes("monitor") || pName.includes("headphone") || pName.includes("mouse") || pName.includes("keyboard") || pName.includes("display");
  }

  if (fCat.includes("video games") || fCat.includes("game")) {
    return pCat.includes("game") || pCat.includes("gaming") || pName.includes("playstation") || pName.includes("xbox") || pName.includes("controller");
  }

  if (fCat.includes("home") || fCat.includes("furniture")) {
    return pCat.includes("home") || pCat.includes("furniture") || pName.includes("chair") || pName.includes("lamp") || pName.includes("desk") || pName.includes("table");
  }

  if (fCat.includes("apparel") || fCat.includes("fashion")) {
    return pCat.includes("apparel") || pCat.includes("fashion") || pCat.includes("clothing") || pName.includes("shirt") || pName.includes("shoe") || pName.includes("jacket");
  }

  if (fCat.includes("beauty") || fCat.includes("personal")) {
    return pCat.includes("beauty") || pCat.includes("personal") || pCat.includes("care") || pName.includes("serum") || pName.includes("oil") || pName.includes("shampoo");
  }

  if (fCat.includes("kitchen")) {
    return pCat.includes("kitchen") || pName.includes("fryer") || pName.includes("cooker") || pName.includes("oven");
  }

  if (fCat.includes("gym") || fCat.includes("fitness") || fCat.includes("sport")) {
    return pCat.includes("gym") || pCat.includes("fitness") || pCat.includes("sport") || pName.includes("workout") || pName.includes("dumbbell");
  }

  return false;
}

// ── Inner component that uses useSearchParams ──────────────────────────────
function FeaturingContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";
  const selectedCategory = searchParams.get("category") ?? "";

  const query = rawQuery.trim().toLowerCase();
  const categoryFilter = selectedCategory.trim();

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[]>([]);
  const [aiIntentSummary, setAiIntentSummary] = useState<string>("");
  const [isAiSearching, setIsAiSearching] = useState(false);

  useEffect(() => {
    fetch("/api/products?t=" + Date.now(), { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProductsList(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load products via REST API:", err);
        setProductsList([]);
        setLoading(false);
      });
  }, []);

  // Trigger AI Natural Language Search when query changes
  useEffect(() => {
    if (!rawQuery.trim() || productsList.length === 0) {
      setAiMatchedIds([]);
      setAiIntentSummary("");
      return;
    }

    setIsAiSearching(true);
    fetch("/api/products/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: rawQuery,
        products: productsList,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.matchedProductIds) && data.matchedProductIds.length > 0) {
          setAiMatchedIds(data.matchedProductIds);
          if (data.intentSummary) setAiIntentSummary(data.intentSummary);
        }
      })
      .catch((err) => console.error("AI search resolution error:", err))
      .finally(() => setIsAiSearching(false));
  }, [rawQuery, productsList]);

  // Derived filtered products list
  const filtered = useMemo(() => {
    if (!query && !categoryFilter) return productsList;

    let items = [...productsList];

    // Filter by Category if selected
    if (categoryFilter) {
      items = items.filter((p) => isCategoryMatch(p.category, categoryFilter, p.name));
    }

    // Filter by Query if present
    if (query) {
      if (aiMatchedIds.length > 0) {
        const aiSet = new Set(aiMatchedIds);
        const matched = items.filter((p) => aiSet.has(String(p.id)));
        matched.sort((a, b) => aiMatchedIds.indexOf(String(a.id)) - aiMatchedIds.indexOf(String(b.id)));

        if (matched.length > 0) return matched;
      }

      // Tokenized fallback matcher
      const tokens = query.split(/\s+/).filter((t) => t.length > 1 && !["for", "a", "an", "the", "in", "on", "with", "day", "under", "setup"].includes(t));

      items = items.filter((p) => {
        const text = (p.name + " " + p.category + " " + (p.description || "")).toLowerCase();
        if (text.includes(query)) return true;
        if (tokens.length > 0) {
          return tokens.some((tok) => text.includes(tok));
        }
        return false;
      });
    }

    return items;
  }, [productsList, query, categoryFilter, aiMatchedIds]);

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
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="size-4 text-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
              {categoryFilter
                ? `Category Filter: ${selectedCategory}`
                : query
                ? `AI Natural Intent Search: "${rawQuery}"`
                : "Handpicked for you"}
            </span>
            {query && (
              <span className="rounded-full bg-linear-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                {isAiSearching ? "⚡ AI Intent Matching..." : "✨ AI Intent Matched"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {categoryFilter ? selectedCategory : query ? `Search Results` : "Featured Products"}
            </h2>
            {(categoryFilter || query) && (
              <Link
                href="/"
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-3 py-1 text-xs font-bold transition-all"
              >
                Clear Search ✕
              </Link>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {aiIntentSummary || (
              <>
                Showing <span className="font-semibold text-zinc-700 dark:text-zinc-300">{filtered.length}</span> product{filtered.length !== 1 ? "s" : ""}
                {categoryFilter ? ` in ${selectedCategory}` : ""}
              </>
            )}
          </p>
        </div>

        {!query && !categoryFilter && (
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
              {rawQuery
                ? `No results for "${rawQuery}"`
                : selectedCategory
                ? `No products found in "${selectedCategory}"`
                : "No products currently available"}
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              {rawQuery || selectedCategory
                ? "Try a different search term or category filter."
                : "Click below to refresh and load products from Neon DB."}
            </p>
          </div>
          {rawQuery || selectedCategory ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Browse all products
            </Link>
          ) : (
            <button
              onClick={() => {
                setLoading(true);
                fetch("/api/products?t=" + Date.now(), { cache: "no-store" })
                  .then((res) => (res.ok ? res.json() : []))
                  .then((data) => {
                    setProductsList(Array.isArray(data) ? data : []);
                    setLoading(false);
                  })
                  .catch(() => setLoading(false));
              }}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
            >
              🔄 Refresh Products
            </button>
          )}
        </div>
      )}

      {/* ── Products Grid ────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product: Product) => (
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