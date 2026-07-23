"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '@/lib/products'
import { useUser } from '@clerk/nextjs'

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number | string) => void;
  isInWishlist: (productId: number | string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useUser()
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // 1. Load wishlist
  useEffect(() => {
    if (isSignedIn && user) {
      // Fetch from Postgres via REST API
      fetch("/api/wishlist")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setWishlist(data)
          }
          setIsLoaded(true)
        })
        .catch((err) => {
          console.error("Failed to fetch wishlist from DB:", err)
          setIsLoaded(true)
        })
    } else {
      // Fallback to localStorage for guest users
      try {
        const stored = localStorage.getItem('velora_wishlist')
        if (stored) {
          setWishlist(JSON.parse(stored))
        }
      } catch (e) {
        console.error("Failed to load wishlist from localStorage", e)
      }
      setIsLoaded(true)
    }
  }, [isSignedIn, user])

  // 2. Save wishlist to localStorage (only for guest users)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      try {
        localStorage.setItem('velora_wishlist', JSON.stringify(wishlist))
      } catch (e) {
        console.error("Failed to save wishlist to localStorage", e)
      }
    }
  }, [wishlist, isLoaded, isSignedIn])

  const toggleWishlist = async (product: Product) => {
    const exists = wishlist.some(item => item.id === product.id)

    // A. If logged in, sync to database
    if (isSignedIn && user) {
      const action = exists ? "remove" : "add"
      // Optimistic state update
      setWishlist((prev) =>
        exists ? prev.filter(item => item.id !== product.id) : [...prev, product]
      )

      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            action,
          }),
        })
      } catch (err) {
        console.error("Failed to toggle wishlist in database:", err)
        // Rollback state on error
        setWishlist((prev) =>
          exists ? [...prev, product] : prev.filter(item => item.id !== product.id)
        )
      }
    } else {
      // B. Guest user local fallback
      setWishlist((prev) =>
        exists ? prev.filter(item => item.id !== product.id) : [...prev, product]
      )
    }
  }

  const removeFromWishlist = async (productId: number | string) => {
    const product = wishlist.find(item => item.id === productId)
    if (!product) return

    // A. If logged in, sync to database
    if (isSignedIn && user) {
      // Optimistic state update
      setWishlist((prev) => prev.filter(item => item.id !== productId))

      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            action: "remove",
          }),
        })
      } catch (err) {
        console.error("Failed to remove from database wishlist:", err)
        // Rollback state on error
        setWishlist((prev) => [...prev, product])
      }
    } else {
      // B. Guest user local fallback
      setWishlist((prev) => prev.filter(item => item.id !== productId))
    }
  }

  const isInWishlist = (productId: number | string) => {
    return wishlist.some(item => item.id === productId)
  }

  const wishlistCount = wishlist.length

  return (
    <WishlistContext.Provider value={{
      wishlist,
      toggleWishlist,
      removeFromWishlist,
      isInWishlist,
      wishlistCount
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
