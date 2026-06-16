"use client"

import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { ProductCard } from "./product-card"
import { CategorySelector, type CategoryId } from "./category-selector"
import { useStore } from "./store"
import { fetchProductsFromGoogleSheet, products as initialProducts } from "@/lib/menu-data"
import { MENU_CSV_URL } from "@/lib/menu-data"

export function HomeScreen() {
  const { setScreen } = useStore()
  const [products, setProducts] = useState(initialProducts)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await fetchProductsFromGoogleSheet(MENU_CSV_URL)
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory)

  return (
    <div className="min-h-dvh pb-32">
      {/* HEADER CON LOGO */}
      <header className="sticky top-0 z-20 border-b border-[#333] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="Quemehuencho" 
              className="h-12 w-12 object-contain rounded-full"
            />
            <div>
              <h1 className="font-heading text-xl font-extrabold text-[#ff751f] uppercase tracking-wide">
                Quemehuencho
              </h1>
              <p className="text-xs text-gray-400 font-medium">Churros de Verdad</p>
            </div>
          </div>
          
          <button
            onClick={() => setScreen("cart")}
            className="relative flex size-11 items-center justify-center rounded-full bg-[#ff751f] text-black transition-transform active:scale-95"
            aria-label="Ver carrito"
          >
            <ShoppingBag className="size-5" />
          </button>
        </div>
      </header>

      {/* LOGO GRANDE - Reemplaza el hero */}
      <section className="px-4 py-6">
        <div className="mx-auto max-w-xs">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff751f] to-[#cc5500] p-8 shadow-2xl">
            <img
              src="/images/logo.png"
              alt="Quemehuencho Logo"
              className="h-full w-full object-contain drop-shadow-2xl"
            />
          </div>
          <div className="mt-4 text-center">
            <h2 className="font-heading text-2xl font-extrabold text-white uppercase tracking-wide">
              Todo de Verdad
            </h2>
            <p className="mt-1 text-sm text-gray-400 font-medium">
              Los mejores churros de Puerto Madryn
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="px-4 pb-4">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </section>

      {/* PRODUCTOS */}
      <section className="px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff751f] border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No hay productos en esta categoría
          </p>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}