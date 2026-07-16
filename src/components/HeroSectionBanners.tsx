"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { heroSec } from "@/lib/HeroSection"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function HeroSectionBanners() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const slidesCount = heroSec.length

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slidesCount)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slidesCount) % slidesCount)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Set up native mouseenter and mouseleave listeners to guarantee stable triggers
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleMouseEnter = () => {
      setIsPaused(true)
    }
    const handleMouseLeave = () => {
      setIsPaused(false)
    }

    el.addEventListener("mouseenter", handleMouseEnter)
    el.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter)
      el.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  // Set up the 5 seconds auto-scroll timer
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slidesCount)
    }, 5000) // 5 seconds

    return () => clearInterval(timer)
  }, [currentIndex, isPaused, slidesCount])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-zinc-950 aspect-3/1 shadow-xl group"
    >
      {/* Slides Container */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {heroSec.map((banner, index) => (
          <div key={banner.id} className="relative w-full h-full shrink-0 select-none">
            {/* Background Image */}
            <Image
              src={banner.image}
              alt={banner.category || ""}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="object-cover transform scale-100 transition-transform duration-10000 ease-out group-hover:scale-105"
              priority={index === 0}
            />

            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-zinc-900/10 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-zinc-950/70 via-transparent to-transparent hidden md:block" />

            {/* Slide Title and Description (Bottom Left) */}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-12 flex flex-col justify-end h-full">
              <div className="max-w-lg md:max-w-xl text-left">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
                  Featured Category
                </span>
                
                <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight text-white mt-1.5 md:mt-3 leading-tight drop-shadow-sm">
                  {banner.title}
                </h2>
                
                <p className="text-[10px] sm:text-xs md:text-sm text-zinc-300 mt-1 md:mt-3 font-medium line-clamp-2">
                  Discover outstanding collections and handpicked luxury pieces crafted for premium lifestyle needs.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Static hover shield overlay to stabilize mouseenter/mouseleave events during translations */}
      <div className="absolute inset-0 z-10 pointer-events-auto bg-transparent" />

      {/* Manual Control Arrows (Visible on Hover) */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex size-8 sm:size-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-xs opacity-0 transition-all duration-300 hover:bg-black/40 group-hover:opacity-100 focus:opacity-100 active:scale-95"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="size-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex size-8 sm:size-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-xs opacity-0 transition-all duration-300 hover:bg-black/40 group-hover:opacity-100 focus:opacity-100 active:scale-95"
        aria-label="Next Slide"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Play/Pause state indicator helper */}
      <div className="absolute top-4 right-4 z-20 flex items-center justify-center size-7 rounded-full bg-black/30 border border-white/10 text-white backdrop-blur-xs text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
        {isPaused ? <Pause className="size-3.5" /> : <Play className="size-3.5 animate-pulse" />}
      </div>

      {/* Interactive Navigation Dots (Pagination) */}
      <div className="absolute bottom-4 right-4 md:right-12 z-20 flex gap-1.5">
        {heroSec.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-350",
              currentIndex === index
                ? "w-5 bg-white shadow-sm"
                : "w-1.5 bg-white/40 hover:bg-white/70"
            )}
            title={`Go to slide ${index + 1}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}