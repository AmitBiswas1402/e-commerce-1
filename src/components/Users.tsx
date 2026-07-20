"use client"

import React, { useEffect } from "react"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { Button } from "./ui/button"
import Cart from "./Cart"
import WishList from "./WishList"

export default function Users() {
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (isSignedIn && user) {
      const email = user.emailAddresses[0]?.emailAddress
      if (email) {
        fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerkId: user.id,
            email: email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          }),
        }).catch((err) => {
          console.error("Failed to sync user via REST API:", err)
        })
      }
    }
  }, [isSignedIn, user])

  // Handle loading state gracefully to avoid visual flicker
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-8 w-16 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      {/* WishList Icon Component */}
      <WishList />

      {/* Cart Icon Component */}
      <Cart />

      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

      {!isSignedIn ? (
        <div className="flex items-center gap-1 sm:gap-2">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              Sign In
            </Button>
          </SignInButton>
          
          <SignUpButton mode="modal">
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile avatar dropdown */}
          <div className="flex items-center gap-2">
            <UserButton />
            {user && (
              <span className="hidden lg:inline text-xs font-bold text-zinc-700 dark:text-zinc-300 max-w-25 truncate">
                {user.firstName || user.username || "User"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
