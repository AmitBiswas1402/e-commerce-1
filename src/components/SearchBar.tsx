"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { type Product } from "@/lib/products"
import { slugify } from "@/lib/slug"

interface SearchBarProps extends React.HTMLAttributes<HTMLFormElement> {
  onSearch?: (query: string, category: string) => void
  placeholder?: string
}

const CATEGORIES = [
  { value: "all", label: "All Departments" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "home", label: "Home & Living" },
  { value: "beauty", label: "Beauty & Wellness" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "books", label: "Books & Media" },
]

// ── Match highlight helper ──────────────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

export default function SearchBar({
  className,
  onSearch,
  placeholder = 'Ask AI: e.g. "Lightweight shoes for rainy day running"...',
  ...props
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [productsList, setProductsList] = useState<Product[]>([])

  useEffect(() => {
    fetch("/api/products?t=" + Date.now(), { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setProductsList(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error("Failed to load products in SearchBar via REST API:", err)
      })
  }, [])

  // ── Derive suggestions via useMemo ────────────────
  const suggestions = useMemo<Product[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const STOPWORDS = new Set(["for", "a", "an", "the", "in", "on", "at", "with", "by", "of", "to", "day", "is", "are", "and", "or", "setup", "under", "below"])
    const rawTokens = q.split(/\s+/).map((t) => t.replace(/[^\w]/g, "")).filter(Boolean)
    const tokens = rawTokens.filter((t) => t.length > 1 && !STOPWORDS.has(t))

    if (tokens.length === 0) return []

    const isShoeQuery = tokens.some((t) => ["shoes", "shoe", "sneaker", "footwear", "running"].includes(t))
    const isAudioQuery = tokens.some((t) => ["headphone", "headphones", "earbuds", "earbud", "audio", "headset", "speaker"].includes(t))
    const isDesktopQuery = tokens.some((t) => ["desktop", "monitor", "display", "keyboard", "mouse", "desk", "chair"].includes(t))
    const isBookQuery = tokens.some((t) => ["book", "books", "habit", "novel", "read"].includes(t))

    const scored = productsList.map((p) => {
      const name = p.name.toLowerCase()
      const category = (p.category || "").toLowerCase()
      const desc = (p.description || "").toLowerCase()
      const fullText = `${name} ${category} ${desc}`

      let score = 0

      if (fullText.includes(q)) score += 100
      if (name.includes(q)) score += 150

      if (isShoeQuery) {
        if (name.includes("shoe") || name.includes("sneaker") || name.includes("running") || category.includes("shoes") || category.includes("sports")) score += 80
        else if (category.includes("audio") || name.includes("headphone") || name.includes("earbud")) return { p, score: -100 }
      }

      if (isAudioQuery) {
        if (name.includes("headphone") || name.includes("earbud") || name.includes("audio") || name.includes("headset") || category.includes("electronics")) score += 80
        else if (category.includes("apparel") || name.includes("shoe")) return { p, score: -100 }
      }

      if (isDesktopQuery) {
        if (name.includes("monitor") || name.includes("chair") || name.includes("keyboard") || name.includes("mouse") || name.includes("desk") || category.includes("furniture") || category.includes("electronics")) score += 80
      }

      if (isBookQuery) {
        if (category.includes("book") || name.includes("book") || name.includes("habit") || name.includes("psychology")) score += 80
      }

      tokens.forEach((tok) => {
        if (name.includes(tok)) score += 25
        else if (category.includes(tok)) score += 15
        else if (desc.includes(tok)) score += 5
      })

      return { p, score }
    })

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.p)
      .slice(0, 5)
  }, [query, productsList])

  // ── Derive dropdown open state (no separate state needed) ─────────────────
  const showDropdown = isFocused && suggestions.length > 0

  // ── Click outside to close ────────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ── Navigate to a product page ────────────────────────────────────────────
  const navigateToProduct = useCallback(
    (product: Product) => {
      setQuery(product.name)
      setActiveIndex(-1)
      setIsFocused(false)
      router.push(`/${slugify(product.name)}`)
    },
    [router]
  )

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, -1))
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault()
        const selected = suggestions[activeIndex]
        if (selected) navigateToProduct(selected)
      } else if (e.key === "Escape") {
        setIsFocused(false)
        setActiveIndex(-1)
      }
    },
    [showDropdown, suggestions, activeIndex, navigateToProduct]
  )

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setActiveIndex(-1)
  }

  const handleClear = () => {
    setQuery("")
    setActiveIndex(-1)
    setIsFocused(false)
    router.push("/")
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      navigateToProduct(suggestions[activeIndex])
      return
    }
    const q = query.trim()
    setIsFocused(false)
    if (onSearch) {
      onSearch(q, category)
    }
    if (q) {
      router.push(`/?q=${encodeURIComponent(q)}`)
    } else {
      router.push("/")
    }
  }

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.value === category)?.label || "All"

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "group/search flex h-11 w-full items-center rounded-full border bg-white shadow-xs transition-all duration-300 dark:bg-zinc-950",
          isFocused
            ? "border-indigo-500 ring-4 ring-indigo-500/10 dark:border-indigo-400 dark:ring-indigo-400/10"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
          className
        )}
        {...props}
      >
        {/* Category Dropdown (Left) */}
        <div className="h-full">
          <Select value={category} onValueChange={(val) => setCategory(val || "all")}>
            <SelectTrigger
              className="h-full rounded-l-full rounded-r-none border-0 border-r border-zinc-200 bg-zinc-50/50 px-4 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-0 focus-visible:border-none focus:ring-0 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
              size="default"
            >
              <span className="max-w-20 truncate sm:max-w-30">
                {selectedCategoryLabel}
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className="border border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95"
            >
              {CATEGORIES.map((cat) => (
                <SelectItem
                  key={cat.value}
                  value={cat.value}
                  className="cursor-pointer text-xs transition-colors hover:bg-indigo-50 hover:text-indigo-900 focus:bg-indigo-50 focus:text-indigo-900 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-200 dark:focus:bg-indigo-950/40 dark:focus:text-indigo-200"
                >
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input Field (Middle) */}
        <div className="relative flex flex-1 h-full items-center px-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 pr-2"
            autoComplete="off"
          />
        </div>

        {/* Search / Clear Action Button (Right) */}
        <button
          type={query.length > 0 ? "button" : "submit"}
          onClick={query.length > 0 ? handleClear : undefined}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 mr-1 shrink-0 cursor-pointer"
          aria-label={query.length > 0 ? "Clear search" : "Search"}
          title={query.length > 0 ? "Clear search" : "Search"}
        >
          {query.length > 0 ? (
            <X className="size-4 transition-transform duration-300 animate-in fade-in spin-in-90" />
          ) : (
            <Search className="size-4 transition-transform duration-300 group-hover/search:scale-110" />
          )}
        </button>
      </form>

      {/* ── Suggestions Dropdown ─────────────────────────────────────────── */}
      {showDropdown && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-900/10 dark:shadow-zinc-900/50 overflow-hidden"
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Suggestions
            </span>
          </div>

          {/* Suggestion Items */}
          <ul>
            {suggestions.map((product, idx) => (
              <li key={product.id} role="option" aria-selected={idx === activeIndex}>
                {/* onMouseDown prevents input blur before onClick fires */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => navigateToProduct(product)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    idx === activeIndex
                      ? "bg-indigo-50 dark:bg-indigo-950/30"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  {/* Product thumbnail */}
                  <div className="relative size-11 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                      <HighlightMatch text={product.name} query={query} />
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {product.category} &middot; &#8377;{product.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
                </button>
              </li>
            ))}
          </ul>

          {/* Footer — "Search all products" */}
          <div className="border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
            >
              <Search className="size-3.5" />
              Search &ldquo;{query}&rdquo; in all products
            </button>
          </div>
        </div>
      )}
    </div>
  )
}