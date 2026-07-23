"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { Button } from "./ui/button"
import Cart from "./Cart"
import WishList from "./WishList"
import { Store, ShieldCheck } from "lucide-react"

export default function Users() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [dbUserRole, setDbUserRole] = useState<"CUSTOMER" | "VENDOR" | "ADMIN" | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Sync and fetch user profile strictly from Neon PostgreSQL
  const syncAndFetchUser = useCallback(async () => {
    if (!isSignedIn || !user) return
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (res.ok) {
        const data = await res.json()
        setDbUserRole(data.role || null)

        // If role is blank (null) in DB and user is not on /choose-role page, route them to /choose-role!
        if (data.role === null && pathname !== "/choose-role") {
          router.replace("/choose-role")
        }
      }
    } catch (err) {
      console.error("Failed to sync user via REST API:", err)
    }
  }, [isSignedIn, pathname, router, user])

  useEffect(() => {
    void syncAndFetchUser()
  }, [syncAndFetchUser])

  // Loading state skeleton
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-8 w-16 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {/* Admin Panel Button ONLY for Admin (Amit) */}
      {isSignedIn && dbUserRole === "ADMIN" && (
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-xs shrink-0"
        >
          <ShieldCheck className="size-3.5 text-white" />
          <span>Dashboard</span>
        </Link>
      )}

      {/* Vendor Panel Button ONLY for Vendors */}
      {isSignedIn && dbUserRole === "VENDOR" && (
        <Link
          href="/vendor"
          className="flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition-all shadow-xs shrink-0"
        >
          <Store className="size-3.5 text-white" />
          <span>Dashboard</span>
        </Link>
      )}

      {/* WishList Icon Component */}
      <WishList />

      {/* Cart Icon Component */}
      <Cart />

      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

      {/* Standard Clerk Auth Modals — Redirects to /choose-role after SSO callback */}
      {!isSignedIn ? (
        <div className="flex items-center gap-1 sm:gap-2">
          <SignInButton mode="modal" fallbackRedirectUrl="/choose-role" forceRedirectUrl="/choose-role">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              Sign In
            </Button>
          </SignInButton>

          <SignUpButton mode="modal" fallbackRedirectUrl="/choose-role" forceRedirectUrl="/choose-role">
            <Button
              variant="default"
              size="sm"
              className="rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-xs hover:from-violet-500 hover:to-indigo-500 transition-all duration-300"
            >
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <UserButton />
          <span className="hidden lg:inline text-xs font-bold text-zinc-700 dark:text-zinc-300 max-w-24 truncate">
            {user.firstName || user.username || "User"}
          </span>
        </div>
      )}
    </div>
  )
}
