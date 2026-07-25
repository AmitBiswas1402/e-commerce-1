"use client";

import React, { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Monitor,
  Shirt,
  Gem,
  Utensils,
  Home as HomeIcon,
  Sparkles,
  Trophy,
  Dumbbell,
  BookOpen,
  Gamepad2,
  ShoppingBag,
} from "lucide-react";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import Users from "./Users";
import { heroSec } from "@/lib/HeroSection";

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Electronics: Monitor,
  Apparel: Shirt,
  Fashion: Gem,
  Kitchen: Utensils,
  "Home and Furniture": HomeIcon,
  "Beauty and Personal Care": Sparkles,
  "Sports and Outdoors": Trophy,
  "Gym and Fitness": Dumbbell,
  "Books and Stationery": BookOpen,
  "Video Games": Gamepad2,
};

function CategoryNavRow() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  return (
    <div className="flex items-center justify-between overflow-x-auto gap-4 sm:gap-6 md:gap-8 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none w-full">
      {heroSec.map((item) => {
        const categoryName = item.title || item.category || "";
        const Icon =
          (categoryName && CATEGORY_ICONS[categoryName]) || ShoppingBag;

        const isSelected =
          activeCategory.toLowerCase() === categoryName.toLowerCase();
        const href = isSelected
          ? "/"
          : `/?category=${encodeURIComponent(categoryName)}`;

        return (
          <Link
            key={item.id}
            href={href}
            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 select-none"
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                isSelected
                  ? "bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-200 dark:shadow-none"
                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 group-hover:text-indigo-600 dark:text-zinc-400 dark:group-hover:text-indigo-400 group-hover:scale-110"
              }`}
            >
              <Icon className="size-4" />
            </div>
            <span
              className={`text-[10px] sm:text-xs text-center max-w-18.75 leading-tight wrap-break-words transition-colors ${
                isSelected
                  ? "font-bold text-indigo-600 dark:text-indigo-400"
                  : "font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
              }`}
            >
              {categoryName}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme");
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand Logo (Left) */}
        <div className="shrink-0">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>

        {/* Snug SearchBar (Center) */}
        <div className="hidden md:flex flex-1 justify-center max-w-xl mx-auto">
          <SearchBar placeholder="Search products..." />
        </div>

        {/* Action Controls (Right) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Users />
        </div>
      </div>

      {/* Mobile Search Bar Row (renders on mobile only) */}
      <div className="md:hidden border-t border-zinc-100 dark:border-zinc-900 px-4 py-2 bg-white/95 dark:bg-zinc-950/95">
        <SearchBar placeholder="Search products..." className="max-w-full" />
      </div>

      {/* Categories Navigation Bar */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="py-3 text-xs text-zinc-400">Loading categories...</div>}>
            <CategoryNavRow />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
