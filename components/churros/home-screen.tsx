"use client"

import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { ProductCard } from "./product-card"
import { CategorySelector, type CategoryId } from "./category-selector"
import { useStore } from "./store"
import { fetchProductsFromGoogleSheet, products as initialProducts, MENU_CSV_URL } from "@/lib/menu-data"

export function HomeScreen() {
  const { setScreen } = useStore()
  const [products, setProducts] = useState(initialProducts)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        // Usamos la URL real de tu planilla
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
    <div className="min-h-dvh pb-32 bg-[#0a0a0a]">
      
      {/* 1. HEADER PEQUEÑO Y LIMPIO */}
      <header className="sticky top-0 z-30 border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="Quemehuencho" 
              className="h-10 w-10 rounded-full object-contain bg-[#111] p-1"
            />
            <div className="leading-tight">
              <h1 className="text-base font-extrabold text-[#ff751f] tracking-wide">
                Quemehuencho
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">
                Hacemos churros inolvidables
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setScreen("cart")}
            className="relative flex size-10 items-center justify-center rounded-full bg-[#ff751f] text-black shadow-lg transition-transform active:scale-95"
            aria-label="Ver carrito"
          >
            <ShoppingBag className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* 2. HERO / SPLASH SCREEN (Logo grande sin fondo naranja) */}
      <section className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <img 
          src="/images/logo.png" 
          alt="Quemehuencho Logo Grande" 
          className="w-52 h-52 md:w-64 md:h-64 object-contain drop-shadow-2xl mb-6" 
        />
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
          Todo de Verdad
        </h2>
        <p className="text-sm text-gray-400 font-bold mt-3 tracking-widest uppercase">
          Puerto Madryn - Argentina
        </p>
      </section>

      {/* 3. SELECTOR DE CATEGORÍAS */}
      <section className="px-4 pb-6 sticky top-[68px] z-20 bg-[#0a0a0a]/90 backdrop-blur-sm py-3">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </section>

      {/* 4. LISTA DE PRODUCTOS */}
      <section className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff751f] border-t-transparent" />
            <p className="text-sm text-gray-500">Cargando el menú...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No hay productos en esta categoría</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </section>

    </div>
  )
}