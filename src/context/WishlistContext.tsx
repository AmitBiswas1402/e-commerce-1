"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '@/lib/products'

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('velora_wishlist')
      if (stored) {
        setWishlist(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load wishlist from localStorage", e)
    }
    setIsLoaded(true)
  }, [])

  // Save wishlist to localStorage on modification
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('velora_wishlist', JSON.stringify(wishlist))
      } catch (e) {
        console.error("Failed to save wishlist to localStorage", e)
      }
    }
  }, [wishlist, isLoaded])

  const toggleWishlist = (product: Product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some(item => item.id === product.id)
      if (exists) {
        return prevWishlist.filter(item => item.id !== product.id)
      }
      return [...prevWishlist, product]
    })
  }

  const removeFromWishlist = (productId: number) => {
    setWishlist((prevWishlist) => prevWishlist.filter(item => item.id !== productId))
  }

  const isInWishlist = (productId: number) => {
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
