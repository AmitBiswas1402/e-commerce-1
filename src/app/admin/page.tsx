"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Package,
  FolderTree,
  Award,
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
  Layers,
  ShoppingBag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Interfaces
interface ProductItem {
  id: string
  name: string
  slug: string
  description?: string
  categoryId: string
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
  description?: string
  imageUrl?: string
  isActive?: boolean
}

interface BrandItem {
  id: string
  name: string
  slug: string
  logoUrl?: string
  isActive?: boolean
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null)

  // Product Form State
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

  // Category Form State
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
  })

  // Brand Form State
  const [brandForm, setBrandForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch initial data
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
      console.error("Failed to load admin dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // PRODUCT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
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
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete product")
      fetchData()
    } catch (err: any) {
      alert(err.message || "Delete failed")
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const openNewCategoryModal = () => {
    setEditingCategory(null)
    setCatForm({ name: "", slug: "", description: "", imageUrl: "" })
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategory(cat)
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
    })
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        id: editingCategory?.id,
        name: catForm.name,
        slug: catForm.slug,
        description: catForm.description,
        imageUrl: catForm.imageUrl,
      }

      const method = editingCategory ? "PUT" : "POST"
      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save category")
      }

      setIsCategoryModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete category")
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BRAND HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const openNewBrandModal = () => {
    setEditingBrand(null)
    setBrandForm({ name: "", slug: "", logoUrl: "" })
    setIsBrandModalOpen(true)
  }

  const openEditBrandModal = (b: BrandItem) => {
    setEditingBrand(b)
    setBrandForm({
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl || "",
    })
    setIsBrandModalOpen(true)
  }

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        id: editingBrand?.id,
        name: brandForm.name,
        slug: brandForm.slug,
        logoUrl: brandForm.logoUrl,
      }

      const method = editingBrand ? "PUT" : "POST"
      const res = await fetch("/api/brands", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save brand")
      }

      setIsBrandModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return
    try {
      const res = await fetch(`/api/brands?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete brand")
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Filtered lists
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <span>Back to Shop</span>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <Layers className="size-4" />
              </div>
              <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Vendor & Admin Panel
              </h1>
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
              <span>Refresh</span>
            </Button>

            <Button
              onClick={openNewProductModal}
              size="sm"
              className="gap-1.5 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-sm hover:from-violet-500 hover:to-indigo-500"
            >
              <Plus className="size-4" />
              <span>Add Product</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Total Products
              </CardTitle>
              <Package className="size-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {products.length}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Active catalog inventory
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Categories
              </CardTitle>
              <FolderTree className="size-4 text-violet-600 dark:text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {categories.length}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Organized store sections
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Brands
              </CardTitle>
              <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {brands.length}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Registered manufacturers
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Featured Items
              </CardTitle>
              <Sparkles className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {products.filter((p) => p.isFeatured).length}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Highlighted on homepage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Management Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <TabsList className="bg-zinc-100 dark:bg-zinc-800/80 p-1">
              <TabsTrigger value="products" className="text-xs font-bold gap-1.5">
                <Package className="size-3.5" />
                <span>Products ({filteredProducts.length})</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs font-bold gap-1.5">
                <FolderTree className="size-3.5" />
                <span>Categories ({filteredCategories.length})</span>
              </TabsTrigger>
              <TabsTrigger value="brands" className="text-xs font-bold gap-1.5">
                <Award className="size-3.5" />
                <span>Brands ({filteredBrands.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: PRODUCTS TABLE */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="products">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Badges</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400">
                          Loading products...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400">
                          No products found. Click "Add Product" to create one.
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
                            {prod.category || "Unassigned"}
                          </td>

                          <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                            {prod.brand || "Generic"}
                          </td>

                          <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{prod.price?.toLocaleString()}
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span className="ml-1.5 text-[10px] line-through text-zinc-400 font-normal">
                                ₹{prod.originalPrice?.toLocaleString()}
                              </span>
                            )}
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

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {prod.isFeatured && (
                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                  Featured
                                </Badge>
                              )}
                              {prod.isNewArrival && (
                                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px]">
                                  New
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditProductModal(prod)}
                                className="h-8 w-8 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400"
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
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: CATEGORIES TABLE */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="categories">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-sm">All Store Categories</h3>
                <Button size="sm" onClick={openNewCategoryModal} className="gap-1 text-xs font-bold">
                  <Plus className="size-3.5" />
                  <span>Add Category</span>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold">
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          {cat.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{cat.slug}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                          {cat.description || "No description"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditCategoryModal(cat)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="h-8 w-8 text-rose-500"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 3: BRANDS TABLE */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="brands">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-sm">All Brands</h3>
                <Button size="sm" onClick={openNewBrandModal} className="gap-1 text-xs font-bold">
                  <Plus className="size-3.5" />
                  <span>Add Brand</span>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold">
                      <th className="py-3 px-4">Brand Name</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredBrands.map((b) => (
                      <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          {b.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{b.slug}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditBrandModal(b)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBrand(b.id)}
                              className="h-8 w-8 text-rose-500"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE / EDIT PRODUCT */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingProduct ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in product details, images, and inventory stock to publish to the store.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Product Name *</label>
                <Input
                  required
                  placeholder="e.g. Sony Wireless Headphones"
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
                placeholder="Product description and highlights..."
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

            {/* Badges & Visibility */}
            <div className="flex items-center gap-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={prodForm.isFeatured}
                  onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                  className="rounded border-zinc-300"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Featured Product</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={prodForm.isNewArrival}
                  onChange={(e) => setProdForm({ ...prodForm, isNewArrival: e.target.checked })}
                  className="rounded border-zinc-300"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">New Arrival</span>
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white hover:bg-indigo-500">
                {isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Publish Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: CREATE / EDIT CATEGORY */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 text-xs pt-2">
            <div className="space-y-1.5">
              <label className="font-bold">Category Name *</label>
              <Input
                required
                placeholder="e.g. Gaming Consoles"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold">Slug (Optional)</label>
              <Input
                placeholder="gaming-consoles"
                value={catForm.slug}
                onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold">Description</label>
              <Input
                placeholder="Short category description..."
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: CREATE / EDIT BRAND */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingBrand ? "Edit Brand" : "Create New Brand"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBrand} className="space-y-4 text-xs pt-2">
            <div className="space-y-1.5">
              <label className="font-bold">Brand Name *</label>
              <Input
                required
                placeholder="e.g. Apple"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold">Slug (Optional)</label>
              <Input
                placeholder="apple"
                value={brandForm.slug}
                onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsBrandModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
