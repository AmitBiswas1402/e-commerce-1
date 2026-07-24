"use client"

import React from 'react'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import VeloraAssistantWidget from '@/components/VeloraAssistantWidget'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        <VeloraAssistantWidget />
      </WishlistProvider>
    </CartProvider>
  )
}

