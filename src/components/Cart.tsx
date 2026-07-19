import React from "react"
import { ShoppingBag } from "lucide-react"
import { buttonVariants } from "./ui/button"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { cn } from "@/lib/utils"

export default function Cart() {
  const { cartCount } = useCart()

  return (
    <Link
      href="/cart"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative flex items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-indigo-400 transition-colors"
      )}
      title="Shopping Cart"
      aria-label="Shopping Cart"
    >
      <ShoppingBag className="size-[1.2rem]" />
      
      {/* Dynamic count badge overlay */}
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
          {cartCount}
        </span>
      )}
    </Link>
  )
}