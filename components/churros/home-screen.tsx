"use client"

import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { ProductCard } from "./product-card"
import { CategorySelector, type CategoryId } from "./category-selector"
import { useStore } from "./store"
import { fetchProductsFromGoogleSheet, products as initialProducts, MENU_CSV_URL, formatPrice } from "@/lib/menu-data"

export function HomeScreen() {
  const { setScreen, subtotal, itemCount } = useStore() // <-- AGREGAR subtotal e itemCount
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
    <div className="min-h-dvh pb-32 bg-[#0a0a0a]">
      
      {/* HEADER CON SUBTOTAL REAL */}
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
          
          {/* BOTÓN FLOTANTE DEL CARRITO - ABAJO */}
          <div className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-md px-4">
            <button
              onClick={() => setScreen("cart")}
              className="flex h-16 w-full items-center justify-between rounded-full bg-[#ff751f] px-3 pl-5 text-black shadow-xl transition-transform active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <span className="relative flex size-10 items-center justify-center rounded-full bg-black">
                  <ShoppingBag className="size-5" strokeWidth={2.5} />
                  {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#ff751f] text-xs font-bold text-black border-2 border-black">
                      {itemCount}
                    </span>
                  )}
                </span>
                <span className="font-bold">Ver pedido</span>
              </span>
              <span className="rounded-full bg-black px-4 py-2 font-extrabold tabular-nums text-[#ff751f]">
                {formatPrice(subtotal)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <img 
          src="/images/logo.png" 
          alt="Quemehuencho Logo Grande" 
          className="w-48 h-48 object-contain drop-shadow-2xl mb-4 rounded-full"  
        />
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
          Todo de Verdad
        </h2>
        <p className="text-xs text-gray-400 font-bold mt-2 tracking-widest uppercase">
          Puerto Madryn - Argentina
        </p>
      </section>

      {/* CATEGORÍAS */}
      <section className="px-4 pb-4">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </section>

      {/* PRODUCTOS */}
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