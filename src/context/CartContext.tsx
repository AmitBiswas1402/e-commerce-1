"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { Product } from '@/lib/products'

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number | string) => void;
  updateQuantity: (productId: number | string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [dbReady, setDbReady] = useState(false)
  const cartRef = useRef<CartItem[]>([])

  useEffect(() => {
    cartRef.current = cart
  }, [cart])

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('velora_cart')
      if (stored) {
        setCart(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e)
    }
    setIsLoaded(true)
  }, [])

  // Save cart to localStorage on modification
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('velora_cart', JSON.stringify(cart))
      } catch (e) {
        console.error("Failed to save cart to localStorage", e)
      }
    }
  }, [cart, isLoaded])

  // Pull the signed-in user's persisted cart (or push the local one)
  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      setDbReady(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/cart')
        if (!res.ok) throw new Error('Failed to fetch server cart')
        const data = await res.json()
        if (cancelled) return
        if (Array.isArray(data) && data.length > 0) {
          setCart(data)
        } else if (cartRef.current.length > 0) {
          await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: cartRef.current.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity,
              })),
            }),
          })
        }
      } catch (e) {
        console.error("Failed to sync cart with server", e)
      } finally {
        if (!cancelled) setDbReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoaded, user])

  // Persist cart changes to the server (debounced)
  useEffect(() => {
    if (!isLoaded || !dbReady || !user) return
    const id = setTimeout(async () => {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((i) => ({
              productId: i.product.id,
              quantity: i.quantity,
            })),
          }),
        })
      } catch (e) {
        console.error("Failed to persist cart to server", e)
      }
    }, 600)
    return () => clearTimeout(id)
  }, [cart, isLoaded, dbReady, user])

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id)
      if (existingIndex > -1) {
        const newCart = [...prevCart]
        newCart[existingIndex].quantity += quantity
        return newCart
      }
      return [...prevCart, { product, quantity }]
    })
  }

  const removeFromCart = (productId: number | string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prevCart) =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartSubtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartSubtotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
