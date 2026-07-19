"use client";

import React, { useEffect } from "react";
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
          <Logo size="md" />
        </div>

        {/* Snug SearchBar (Center) */}
        <div className="hidden md:flex flex-1 justify-center max-w-xl mx-auto">
          <SearchBar placeholder="Search products..." />
        </div>

        {/* Action Controls (Right) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User authentication, Cart, Wishlist */}
          <div className="pl-1">
            <Users />
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Row (renders on mobile only) */}
      <div className="md:hidden border-t border-zinc-100 dark:border-zinc-900 px-4 py-2 bg-white/95 dark:bg-zinc-950/95">
        <SearchBar placeholder="Search products..." className="max-w-full" />
      </div>

      {/* Categories Navigation Bar (Underneath header with even spacing) */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto gap-4 sm:gap-6 md:gap-8 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
            {heroSec.map((item) => {
              const categoryName = item.title || item.category || "";
              const Icon = (categoryName && CATEGORY_ICONS[categoryName]) || ShoppingBag;
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0 select-none"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-500 group-hover:text-indigo-600 dark:text-zinc-400 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors text-center max-w-[75px] leading-tight break-words">
                    {categoryName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
