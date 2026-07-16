"use client"

import React, { useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

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

export default function SearchBar({ className, onSearch, placeholder = "Search for products, brands, and more...", ...props }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query, category)
    }
    console.log("Search query submitted:", { query, category })
  }

  const selectedCategoryLabel = CATEGORIES.find(c => c.value === category)?.label || "All"

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "group/search flex h-11 w-full max-w-2xl items-center rounded-full border bg-white shadow-xs transition-all duration-300 dark:bg-zinc-950",
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
          <SelectContent className="border border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
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
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        
        {/* Sparkle or visual helper for AI / interactive feels */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Action Search Button (Right) */}
      <button
        type="submit"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-sm transition-all duration-300 hover:scale-105 hover:from-violet-500 hover:to-indigo-500 active:scale-95 mr-1 shrink-0"
        aria-label="Search"
      >
        <Search className="size-4 transition-transform duration-300 group-hover/search:scale-110" />
      </button>
    </form>
  )
}