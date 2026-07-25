"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/context/CartContext"
import { type Product } from "@/lib/products"
import {
  Bot,
  Sparkles,
  X,
  Minimize2,
  Send,
  ShoppingCart,
  ExternalLink,
  Check,
  RotateCcw,
  Star,
  ChevronRight,
} from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  products?: Product[]
  quickReplies?: string[]
  timestamp: Date
}

export default function VeloraAssistantWidget() {
  // Open by default on loading the website
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [addedItems, setAddedItems] = useState<Record<string | number, boolean>>({})

  const { addToCart } = useCart()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "👋 **Hi! I'm Velora AI Assistant**, your personal shopping companion.\n\nI can help you find products, check live stock, or answer questions about shipping, returns, and warranty!\n\nWhat are you looking for today?",
      quickReplies: [
        "Headphones under ₹30,000",
        "Gift for a gamer under 6k",
        "Shipping & Return policy",
        "What's in stock?"
      ],
      timestamp: new Date()
    }
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized, isLoading])

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim()
    if (!query || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json().catch(() => ({
        message: "Here are some recommendations from our catalog:",
        products: [],
        quickReplies: ["Headphones under ₹30,000", "Gifts under ₹6,000"]
      }))

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Here are some recommendations from our catalog:",
        products: data.products || [],
        quickReplies: data.quickReplies || ["Headphones under ₹30,000", "Gifts under ₹6,000"],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      console.error("Chat error:", err)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I had trouble processing that request. Please try again!",
          quickReplies: ["Try again", "Shipping & Return policy"],
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    addToCart(product, 1)
    setAddedItems(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }))
    }, 2500)
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content: "👋 **Hi! I'm Velora AI Assistant**, your personal shopping companion.\n\nI can help you find products, check live stock, or answer questions about shipping, returns, and warranty!\n\nWhat are you looking for today?",
        quickReplies: [
          "Headphones under ₹30,000",
          "Gift for a gamer under 6k",
          "Shipping & Return policy"
        ],
        timestamp: new Date()
      }
    ])
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          className={`w-[88vw] sm:w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-in-out mb-3 ${
            isMinimized ? "h-[56px]" : "h-[440px] max-h-[55vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 text-white px-3.5 py-3 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                <Bot className="w-4 h-4 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-none">Velora AI</h3>
                  <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-300 rounded border border-amber-300/30">
                    Gemini 2.5
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online Shopping Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-indigo-200 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-indigo-200 hover:text-white"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-sm shadow-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-gray-100"
                      }`}
                    >
                      <div className="whitespace-pre-line">
                        {msg.content.split("\n").map((paragraph, idx) => {
                          const parts = paragraph.split(/(\*\*.*?\*\*)/g)
                          return (
                            <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
                              {parts.map((part, pIdx) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
                                  return (
                                    <strong key={pIdx} className="font-semibold">
                                      {part.slice(2, -2)}
                                    </strong>
                                  )
                                }
                                return part
                              })}
                            </p>
                          )
                        })}
                      </div>

                      {/* Interactive Product Cards Grid */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-3.5 space-y-3 pt-2 border-t border-gray-100">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> Database Product Results ({msg.products.length})
                          </p>
                          <div className="grid grid-cols-1 gap-2.5">
                            {msg.products.map((product) => {
                              const isAdded = addedItems[product.id]
                              return (
                                <div
                                  key={product.id}
                                  className="group flex flex-col bg-white border border-gray-200/80 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all hover:border-violet-300"
                                >
                                  <div className="flex gap-3 items-center">
                                    {/* Thumbnail Image */}
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                      <Image
                                        src={product.images && product.images[0] ? product.images[0] : "/placeholder.jpg"}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="64px"
                                      />
                                      {product.inStock ? (
                                        <span className="absolute top-1 left-1 bg-emerald-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                          In Stock
                                        </span>
                                      ) : (
                                        <span className="absolute top-1 left-1 bg-rose-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                          Out of Stock
                                        </span>
                                      )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                        {product.category || "Velora Store"}
                                      </span>
                                      <h4 className="font-semibold text-xs text-gray-900 truncate mt-0.5">
                                        {product.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="font-bold text-xs text-violet-700">
                                          ₹{product.price.toLocaleString("en-IN")}
                                        </span>
                                        {product.originalPrice > product.price && (
                                          <span className="text-[10px] text-gray-400 line-through">
                                            ₹{product.originalPrice.toLocaleString("en-IN")}
                                          </span>
                                        )}
                                        <div className="flex items-center text-amber-500 text-[10px] ml-auto">
                                          <Star className="w-3 h-3 fill-amber-400" />
                                          <span className="ml-0.5 font-medium">{product.rating || 4.5}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Direct Actions */}
                                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-100">
                                    <button
                                      onClick={(e) => handleAddToCart(product, e)}
                                      disabled={!product.inStock}
                                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                                        isAdded
                                          ? "bg-emerald-600 text-white"
                                          : product.inStock
                                          ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm hover:shadow"
                                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-white" />
                                          <span>Added!</span>
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingCart className="w-3.5 h-3.5" />
                                          <span>{product.inStock ? "Add to Cart" : "Out of Stock"}</span>
                                        </>
                                      )}
                                    </button>

                                    <Link
                                      href={`/${product.slug || product.id}`}
                                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                      onClick={() => setIsMinimized(true)}
                                    >
                                      <span>View</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Reply Chips */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                        {msg.quickReplies.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(chip)}
                            className="bg-white hover:bg-violet-50 text-violet-700 hover:text-violet-800 text-[11px] font-medium px-2.5 py-1 rounded-full border border-violet-200 hover:border-violet-300 shadow-2xs transition-all text-left flex items-center gap-1"
                          >
                            <span>{chip}</span>
                            <ChevronRight className="w-3 h-3 text-violet-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center gap-2.5 text-violet-700 font-medium text-xs bg-violet-50/90 border border-violet-200/80 rounded-2xl px-3.5 py-2.5 w-fit shadow-xs animate-pulse">
                    <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>Please wait, searching...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask e.g. noise-cancelling headphones under 30k..."
                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all placeholder:text-gray-400"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 text-white p-2.5 rounded-xl transition-colors shadow-sm disabled:cursor-not-allowed"
                  aria-label="Send query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Circular Floating Trigger Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setIsMinimized(false)
        }}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-2xl hover:shadow-violet-500/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 relative group ${!isOpen ? 'animate-float' : ''}`}
        aria-label={isOpen ? "Close Velora Assistant" : "Open Velora Assistant"}
      >
        {/* Pulsing glow effect */}
        <div className="absolute -inset-1 bg-violet-400/30 rounded-full blur-sm group-hover:blur-md transition-all animate-pulse" />
        
        {isOpen ? (
          <X className="w-6 h-6 text-white relative z-10 transition-transform duration-300 transform rotate-0" />
        ) : (
          <div className="relative z-10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
            </span>
          </div>
        )}
      </button>
    </div>
  )
}
