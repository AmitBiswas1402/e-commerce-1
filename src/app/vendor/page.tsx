"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Store,
  Lock,
  IndianRupee,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProductItem {
  id: string
  name: string
  slug: string
  description?: string
  categoryId: string
  vendorId?: string
  brandId?: string
  category: string
  brand: string
  price: number
  originalPrice?: number
  stock: number
  status?: string
  isFeatured?: boolean
  isNewArrival?: boolean
  images: string[]
  inStock: boolean
}

interface CategoryItem {
  id: string
  name: string
  slug: string
}

interface BrandItem {
  id: string
  name: string
  slug: string
}

export default function VendorDashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [dbUserId, setDbUserId] = useState<string | null>(null)

  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // CRUD Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)

  const [prodForm, setProdForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    price: "",
    compareAtPrice: "",
    stock: "50",
    status: "PUBLISHED",
    isFeatured: false,
    isNewArrival: false,
    images: [""],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch DB User Details
  useEffect(() => {
    if (isSignedIn && user) {
      fetch(`/api/users?clerkId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.role) setUserRole(data.role)
          if (data.id) setDbUserId(data.id)
        })
        .catch((err) => console.error("Failed to fetch vendor user:", err))
    }
  }, [isSignedIn, user])

  // Fetch catalog & categories
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resProds, resCats, resBrands] = await Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/brands").then((r) => r.json()),
      ])

      setProducts(Array.isArray(resProds) ? resProds : [])
      setCategories(Array.isArray(resCats) ? resCats : [])
      setBrands(Array.isArray(resBrands) ? resBrands : [])
    } catch (err) {
      console.error("Failed to load vendor catalog:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter products created by this specific vendor (or all if admin)
  const myProducts = products.filter((p) => {
    if (userRole === "ADMIN") return true // Admin sees all
    if (!dbUserId) return true // Fallback view
    return p.vendorId === dbUserId || !p.vendorId // Include vendor's items
  })

  const filteredProducts = myProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate metrics
  const totalStockCount = myProducts.reduce((sum, p) => sum + (p.stock || 0), 0)
  const totalValue = myProducts.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0)

  // Product Modal Handlers
  const openNewProductModal = () => {
    setEditingProduct(null)
    setProdForm({
      name: "",
      description: "",
      categoryId: categories[0]?.id || "",
      brandId: brands[0]?.id || "",
      price: "",
      compareAtPrice: "",
      stock: "50",
      status: "PUBLISHED",
      isFeatured: false,
      isNewArrival: false,
      images: [""],
    })
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (prod: ProductItem) => {
    setEditingProduct(prod)
    setProdForm({
      name: prod.name,
      description: prod.description || "",
      categoryId: prod.categoryId || categories[0]?.id || "",
      brandId: prod.brandId || "",
      price: prod.price ? prod.price.toString() : "",
      compareAtPrice: prod.originalPrice ? prod.originalPrice.toString() : "",
      stock: prod.stock !== undefined ? prod.stock.toString() : "50",
      status: prod.status || "PUBLISHED",
      isFeatured: Boolean(prod.isFeatured),
      isNewArrival: Boolean(prod.isNewArrival),
      images: prod.images && prod.images.length > 0 ? [...prod.images] : [""],
    })
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        id: editingProduct?.id,
        name: prodForm.name,
        description: prodForm.description,
        categoryId: prodForm.categoryId,
        vendorId: dbUserId, // tag with this vendor's ID
        brandId: prodForm.brandId,
        price: parseFloat(prodForm.price) || 0,
        compareAtPrice: prodForm.compareAtPrice ? parseFloat(prodForm.compareAtPrice) : undefined,
        stock: parseInt(prodForm.stock, 10) || 0,
        status: prodForm.status,
        isFeatured: prodForm.isFeatured,
        isNewArrival: prodForm.isNewArrival,
        images: prodForm.images.filter((img) => img.trim().length > 0),
      }

      const method = editingProduct ? "PUT" : "POST"
      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save product")
      }

      setIsProductModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this product listing?")) return
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete product")
      fetchData()
    } catch (err: any) {
      alert(err.message || "Delete failed")
    }
  }

  // Access check: If Customer or signed out
  if (isLoaded && userRole === "CUSTOMER") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Lock className="size-8" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              Shopper Account
            </Badge>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Vendor Panel Restricted
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              This panel is exclusively for registered sellers and vendors to list and manage products.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link href="/">
              <Button className="w-full rounded-full bg-indigo-600 text-white text-xs font-bold py-2.5">
                Return to Store Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Store</span>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
                <Store className="size-4" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                  Seller & Vendor Panel
                </h1>
                <p className="text-[10px] text-zinc-400 font-semibold">
                  Manage your store catalog & listings
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              onClick={openNewProductModal}
              size="sm"
              className="gap-1.5 rounded-full bg-linear-to-r from-amber-600 to-purple-600 px-4 text-xs font-bold text-white shadow-sm hover:from-amber-500 hover:to-purple-500"
            >
              <Plus className="size-4" />
              <span>+ List New Product</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                My Listed Products
              </CardTitle>
              <Package className="size-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {myProducts.length}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Active products on site
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Total Units In Stock
              </CardTitle>
              <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {totalStockCount}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Combined inventory units
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Total Inventory Value
              </CardTitle>
              <IndianRupee className="size-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                ₹{totalValue.toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Estimated stock value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table Card */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Your Product Listings ({filteredProducts.length})
              </h3>
              <p className="text-[11px] text-zinc-400">
                Manage your items, prices, image galleries, and inventory stock levels.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <Input
                placeholder="Search my products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Price (₹)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      Loading your products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      You haven't listed any products yet. Click "+ List New Product" to start selling!
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <tr
                      key={prod.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                            {prod.images && prod.images[0] ? (
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                <ImageIcon className="size-4" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5 max-w-xs">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {prod.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">
                              ID: {prod.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                        {prod.category || "General"}
                      </td>

                      <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                        {prod.brand || "Generic"}
                      </td>

                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{prod.price?.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {prod.stock > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="size-3" />
                            {prod.stock} in stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                            <XCircle className="size-3" />
                            Out of stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditProductModal(prod)}
                            className="h-8 w-8 text-zinc-600 hover:text-amber-600 dark:text-zinc-400"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingProduct ? "Edit Product Listing" : "List New Product for Sale"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide product details, price, images, and available stock to list on the store catalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Product Title *</label>
                <Input
                  required
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Category *</label>
                <select
                  required
                  value={prodForm.categoryId}
                  onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Brand</label>
                <select
                  value={prodForm.brandId}
                  onChange={(e) => setProdForm({ ...prodForm, brandId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Stock Quantity</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={prodForm.stock}
                  onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Selling Price (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="24999"
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Original Price (MSRP) (₹)</label>
                <Input
                  type="number"
                  placeholder="34990"
                  value={prodForm.compareAtPrice}
                  onChange={(e) => setProdForm({ ...prodForm, compareAtPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea
                rows={3}
                placeholder="Product description..."
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                className="w-full rounded-md border border-zinc-200 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            {/* Images Input List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Product Images (URLs)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProdForm({ ...prodForm, images: [...prodForm.images, ""] })}
                  className="h-7 text-[11px]"
                >
                  + Add Image URL
                </Button>
              </div>

              {prodForm.images.map((url, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="https://images.unsplash.com/photo-..."
                    value={url}
                    onChange={(e) => {
                      const newImgs = [...prodForm.images]
                      newImgs[idx] = e.target.value
                      setProdForm({ ...prodForm, images: newImgs })
                    }}
                  />
                  {prodForm.images.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newImgs = prodForm.images.filter((_, i) => i !== idx)
                        setProdForm({ ...prodForm, images: newImgs })
                      }}
                      className="text-rose-500 h-9 w-9 shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-500 text-white font-bold">
                {isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Publish Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
