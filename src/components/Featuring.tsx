import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import ProductCard from "./ProductCard";

export default function Featuring() {
  return (
    <section className="w-full py-10">
      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-indigo-500" />
            <span className="text-xs font-semibold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
              Handpicked for you
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Featured Products
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Explore our curated selection of top-rated products across categories — from electronics to fitness.
          </p>
        </div>

        <a
          href="#"
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all duration-200 group"
          aria-label="View all featured products"
        >
          View All
          <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* ── Products Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* ── Mobile "View All" link ───────────────────────────────────── */}
      <div className="mt-6 flex sm:hidden justify-center">
        <a
          href="#"
          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full px-5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          View All Products
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}