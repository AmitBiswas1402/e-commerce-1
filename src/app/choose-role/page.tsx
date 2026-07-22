"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { ShoppingBag, Store, Check, Sparkles, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChooseRolePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER")
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !user) {
      window.location.href = "/"
      return
    }

    // Check user role in Neon PostgreSQL right after SSO callback / login
    const checkDbUserStatus = async () => {
      const email = user.emailAddresses[0]?.emailAddress
      if (!email) {
        setIsCheckingUser(false)
        return
      }

      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            email: email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          }),
        })

        if (res.ok) {
          const data = await res.json()

          // If role is ALREADY filled in Neon DB (not null) -> Skip choose-role and go straight to store!
          if (data.role !== null && data.role !== undefined) {
            window.location.href = "/"
            return
          }
        }
      } catch (err) {
        console.error("Error checking user status on /choose-role:", err)
      } finally {
        setIsCheckingUser(false)
      }
    }

    checkDbUserStatus()
  }, [isLoaded, isSignedIn, user])

  const handleConfirmRole = async () => {
    if (!isSignedIn || !user) return
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          role: selectedRole,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save account role in Neon DB")
      }

      // Role updated in Neon DB! Redirect directly to store homepage
      window.location.href = "/"
    } catch (err: any) {
      alert(err.message || "Failed to complete onboarding")
      setIsSubmitting(false)
    }
  }

  const roleOptions = [
    {
      id: "CUSTOMER" as const,
      title: "Customer Account (Buyer)",
      badge: "Shopper",
      icon: ShoppingBag,
      color: "from-blue-500 to-indigo-600",
      description: "Discover products, add items to cart, place orders, and manage your wishlist.",
    },
    {
      id: "VENDOR" as const,
      title: "Vendor / Seller Account",
      badge: "Seller",
      icon: Store,
      color: "from-amber-500 to-purple-600",
      description: "List products on the store catalog, set prices, manage stock, and access Vendor Panel.",
    },
  ]

  if (!isLoaded || isCheckingUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="size-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Checking account credentials in database...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center p-4 sm:p-6 lg:p-8">
      {/* Center Selection Container */}
      <div className="mx-auto w-full max-w-xl space-y-6">
        {/* Left Aligned Back Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Store Homepage</span>
          </Link>
        </div>

        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold">
            <Sparkles className="size-3.5" />
            <span>Welcome, {user?.firstName || "User"}!</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Choose Your Account Role
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Please choose whether you are joining as a Customer to shop or a Vendor to sell products.
          </p>
        </div>

        {/* 2 Options Cards */}
        <div className="space-y-4">
          {roleOptions.map((opt) => {
            const Icon = opt.icon
            const isSelected = selectedRole === opt.id

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedRole(opt.id)}
                className={`relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-indigo-600 bg-white dark:bg-zinc-900 shadow-xl ring-2 ring-indigo-500/20"
                    : "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/60 dark:bg-zinc-900/40"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${opt.color} text-white shadow-md`}
                >
                  <Icon className="size-6" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {opt.title}
                    </span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check className="size-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleConfirmRole}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg hover:from-violet-500 hover:to-indigo-500 transition-all duration-300"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Saving Account Type...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span>Confirm & Enter Store as {selectedRole === "VENDOR" ? "Vendor" : "Customer"}</span>
                <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
