import React from "react"
import { cn } from "@/lib/utils"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export default function Logo({ className, size = "md", ...props }: LogoProps) {
  const sizeClasses = {
    sm: "h-7 text-lg gap-1.5",
    md: "h-9 text-2xl gap-2",
    lg: "h-12 text-3xl gap-2.5",
  }

  const svgSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  return (
    <div
      className={cn(
        "group flex items-center select-none cursor-pointer font-bold tracking-tight text-foreground transition-all duration-300 active:scale-95",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Premium Gradient SVG Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Glow behind the logo */}
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 blur-md transition duration-300 group-hover:opacity-40" />
        
        <svg
          className={cn(
            "relative transform transition-transform duration-500 ease-out group-hover:rotate-12",
            svgSizes[size]
          )}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="velora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" /> {/* Violet 500 */}
              <stop offset="50%" stopColor="#6366F1" /> {/* Indigo 500 */}
              <stop offset="100%" stopColor="#EC4899" /> {/* Pink 500 */}
            </linearGradient>
          </defs>
          
          {/* Stylized geometric V shape */}
          <path
            d="M6 8L14 26C14.5 27 15.5 27 16 26L24 8C24.5 7 24 6 23 6H19.5C18.5 6 18 6.5 17.5 7.5L15 15.5L12.5 7.5C12 6.5 11.5 6 10.5 6H7C6 6 5.5 7 6 8Z"
            fill="url(#velora-gradient)"
          />
          {/* Inner accent diamond/loop */}
          <path
            opacity="0.8"
            d="M13 14L15 20L17 14L15 10L13 14Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 bg-clip-text font-black tracking-tight text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-pink-400">
          Velora
        </span>
        {size !== "sm" && (
          <span className="text-[9px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            Market
          </span>
        )}
      </div>
    </div>
  )
}