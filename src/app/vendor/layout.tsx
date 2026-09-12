import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Lock, Store } from "lucide-react"
import { requireRole } from "@/lib/authorization"

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const access = await requireRole("VENDOR", "ADMIN")
  if (access.status === 403) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Lock className="size-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-3 py-1 text-xs font-bold">
              Shopper Account
            </span>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Vendor Panel Restricted
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              This panel is exclusively for registered sellers and vendors to list and manage products.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              <Store className="size-4" />
              Return to Store Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }
  if (!access.user) {
    redirect("/")
  }
  return <>{children}</>
}