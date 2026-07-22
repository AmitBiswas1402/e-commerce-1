"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
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
  ShieldCheck,
  Lock,
  Users as UsersIcon,
  Store,
  Calendar,
  Mail,
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
interface VendorUser {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  role: string
  createdAt?: string
}

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

export default function MasterAdminDashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [userRole, setUserRole] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("vendors")
  const [vendorsList, setVendorsList] = useState<VendorUser[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // CRUD Modals state
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

  // Fetch DB User Details
  useEffect(() => {
    if (isSignedIn && user) {
      fetch(`/api/users?clerkId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.role) setUserRole(data.role)
        })
        .catch((err) => console.error("Failed to fetch admin user:", err))
    }
  }, [isSignedIn, user])

  // Fetch initial master data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resVendors, resProds, resCats, resBrands] = await Promise.all([
        fetch("/api/users?role=VENDOR").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/brands").then((r) => r.json()),
      ])

      setVendorsList(Array.isArray(resVendors) ? resVendors : [])
      setProducts(Array.isArray(resProds) ? resProds : [])
      setCategories(Array.isArray(resCats) ? resCats : [])
      setBrands(Array.isArray(resBrands) ? resBrands : [])
    } catch (err) {
      console.error("Failed to load master admin dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Helper to get vendor name for a product
  const getVendorName = (vendorId?: string) => {
    if (!vendorId) return "System Admin"
    const found = vendorsList.find((v) => v.id === vendorId)
    if (found) {
      return found.firstName ? `${found.firstName} ${found.lastName || ""}` : found.email
    }
    return "Registered Vendor"
  }

  // Filtered lists
  const filteredVendors = vendorsList.filter(
    (v) =>
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.firstName && v.firstName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // PRODUCT HANDLERS
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
    if (!confirm("Admin Action: Are you sure you want to delete this product?")) return
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete product")
      fetchData()
    } catch (err: any) {
      alert(err.message || "Delete failed")
    }
  }

  // CATEGORY HANDLERS
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

  // BRAND HANDLERS
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

  // ACCESS CHECK: Admin view only
  if (isLoaded && userRole && userRole !== "ADMIN") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Lock className="size-8" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/20">
              {userRole} Account
            </Badge>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Master Admin Panel Restricted
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              This master control panel is reserved exclusively for site administrators.
              {userRole === "VENDOR" && " As a Vendor, please manage your products in the Vendor Panel."}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {userRole === "VENDOR" ? (
              <Link href="/vendor">
                <Button className="w-full rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5">
                  Go to Vendor Panel
                </Button>
              </Link>
            ) : (
              <Link href="/">
                <Button className="w-full rounded-full bg-indigo-600 text-white text-xs font-bold py-2.5">
                  Return to Store Homepage
                </Button>
              </Link>
            )}
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                  Master Admin Control Panel
                </h1>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                  System Overview: Vendors, Products & Categories
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
              <span className="hidden sm:inline">Refresh Data</span>
            </Button>

            <Button
              onClick={openNewProductModal}
              size="sm"
              className="gap-1.5 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-sm hover:from-purple-500 hover:to-indigo-500"
            >
              <Plus className="size-4" />
              <span>Add System Item</span>
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
                Registered Vendors
              </CardTitle>
              <Store className="size-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {vendorsList.length}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Active marketplace sellers
              </p>
            </CardContent>
          </Card>

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
                Across all sellers & catalog
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
                Site-wide product sections
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
                Manufacturer brands
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Admin Operations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <TabsList className="bg-zinc-100 dark:bg-zinc-800/80 p-1">
              <TabsTrigger value="vendors" className="text-xs font-bold gap-1.5">
                <Store className="size-3.5" />
                <span>Vendors Directory ({filteredVendors.length})</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs font-bold gap-1.5">
                <Package className="size-3.5" />
                <span>All Products ({filteredProducts.length})</span>
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
          {/* TAB 1: VENDORS DIRECTORY */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="vendors">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Registered Marketplace Vendors
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Inspect sellers who have signed up and list products on your website.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold">
                      <th className="py-3 px-4">Vendor Name / Profile</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Products Listed</th>
                      <th className="py-3 px-4">Role Badge</th>
                      <th className="py-3 px-4 text-right">Vendor ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          Loading registered vendors...
                        </td>
                      </tr>
                    ) : filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          No registered vendors found in system.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((vendor) => {
                        const vendorProductsCount = products.filter(
                          (p) => p.vendorId === vendor.id
                        ).length

                        return (
                          <tr key={vendor.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {vendor.imageUrl ? (
                                  <img
                                    src={vendor.imageUrl}
                                    alt={vendor.email}
                                    className="h-8 w-8 rounded-full object-cover border border-zinc-200"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold">
                                    <Store className="size-4" />
                                  </div>
                                )}
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                  {vendor.firstName
                                    ? `${vendor.firstName} ${vendor.lastName || ""}`
                                    : "Vendor Account"}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Mail className="size-3.5 text-zinc-400" />
                                {vendor.email}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                              <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px]">
                                {vendorProductsCount} Products Listed
                              </Badge>
                            </td>

                            <td className="py-3 px-4">
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                Vendor
                              </Badge>
                            </td>

                            <td className="py-3 px-4 text-right font-mono text-[10px] text-zinc-400">
                              {vendor.id}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: ALL PRODUCTS */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="products">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Master Product Catalog ({filteredProducts.length})
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Full oversight of products added by all vendors and system admins.
                  </p>
                </div>
                <Button size="sm" onClick={openNewProductModal} className="gap-1 text-xs font-bold">
                  <Plus className="size-3.5" />
                  <span>Add System Product</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold">
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Vendor Owner</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price (₹)</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
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

                        <td className="py-3 px-4">
                          <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium text-[10px]">
                            {getVendorName(prod.vendorId)}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                          {prod.category || "General"}
                        </td>

                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{prod.price?.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 font-semibold">
                          {prod.stock > 0 ? (
                            <span className="text-emerald-600">{prod.stock} in stock</span>
                          ) : (
                            <span className="text-rose-500">Out of stock</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditProductModal(prod)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(prod.id)}
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
          {/* TAB 3: CATEGORIES TABLE */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="categories">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-sm">Site-Wide Categories</h3>
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
          {/* TAB 4: BRANDS TABLE */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="brands">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-sm">Site-Wide Brands</h3>
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingProduct ? "Edit System Product" : "Create System Product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold">Product Name *</label>
                <Input
                  required
                  placeholder="Product name..."
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold">Category *</label>
                <select
                  required
                  value={prodForm.categoryId}
                  onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs"
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
                <label className="font-bold">Brand</label>
                <select
                  value={prodForm.brandId}
                  onChange={(e) => setProdForm({ ...prodForm, brandId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs"
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
                <label className="font-bold">Stock Quantity</label>
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
                <label className="font-bold">Selling Price (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="24999"
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold">Original Price (MSRP) (₹)</label>
                <Input
                  type="number"
                  placeholder="34990"
                  value={prodForm.compareAtPrice}
                  onChange={(e) => setProdForm({ ...prodForm, compareAtPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold">Description</label>
              <textarea
                rows={3}
                placeholder="Product description..."
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                className="w-full rounded-md border border-zinc-200 bg-white p-2.5 text-xs"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT CATEGORY MODAL */}
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
                placeholder="Category name..."
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold">Description</label>
              <Input
                placeholder="Description..."
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT BRAND MODAL */}
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
                placeholder="Brand name..."
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsBrandModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Save Brand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
