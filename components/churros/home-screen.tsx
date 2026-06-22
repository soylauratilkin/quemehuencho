"use client"

import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { ProductCard } from "./product-card"
import { CategorySelector, type CategoryId } from "./category-selector"
import { useStore } from "./store"
import { fetchProductsFromGoogleSheet, products as initialProducts, MENU_CSV_URL, formatPrice, type Product } from "@/lib/menu-data"

export function HomeScreen() {
  const { setScreen, subtotal, itemCount, items, addItem, increment, decrement } = useStore()
  const [products, setProducts] = useState(initialProducts)
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("combos")
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

  // Función wrapper para convertir Product a CartItem
  function handleAddToCart(product: Product) {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      quantity: 1
    })
  }

  const filteredProducts = products.filter((p) => p.category === selectedCategory)

  return (
    <div className="min-h-dvh pb-32 bg-[#0a0a0a]">
      
      {/* HEADER COMPACTO */}
      <header className="sticky top-0 z-30 border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="Quemehuencho" 
              className="h-12 w-12 rounded-full object-contain bg-[#111] p-1"
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
            className="flex items-center gap-2 rounded-full bg-[#ff751f] px-3 py-2 text-black shadow-lg transition-transform active:scale-95"
            aria-label="Ver carrito"
          >
            <ShoppingBag className="size-5" strokeWidth={2.5} />
            {itemCount > 0 && (
              <>
                <span className="rounded-full bg-black px-2 py-0.5 text-xs font-extrabold text-[#ff751f] tabular-nums">
                  {itemCount}
                </span>
                <span className="font-extrabold tabular-nums text-sm">
                  {formatPrice(subtotal)}
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* HERO CON LOGO + ICONOS DE CONTACTO */}
      <section className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <img 
          src="/images/logo.png" 
          alt="Quemehuencho Logo Grande" 
          className="w-56 h-56 md:w-64 md:h-64 object-contain drop-shadow-2xl mb-4 rounded-full" 
        />
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
          Todo de Verdad
        </h2>
        <p className="text-xs text-gray-400 font-bold mt-2 tracking-widest uppercase">
          Puerto Madryn - Argentina
        </p>
        
        {/* ICONOS DE CONTACTO */}
        <div className="flex items-center gap-4 mt-6">
          <a 
            href="https://wa.me/5492804007296" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex size-12 items-center justify-center rounded-full bg-[#ff751f] text-black shadow-lg transition-transform hover:scale-110 active:scale-95"
            aria-label="WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="size-6 fill-current">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.578-.985zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </a>
          
          <a 
            href="https://instagram.com/quemehuenchoo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex size-12 items-center justify-center rounded-full bg-[#ff751f] text-black shadow-lg transition-transform hover:scale-110 active:scale-95"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          
          <a 
            href="https://maps.google.com/?q=Roque+Sáenz+Peña+212+Puerto+Madryn" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex size-12 items-center justify-center rounded-full bg-[#ff751f] text-black shadow-lg transition-transform hover:scale-110 active:scale-95"
            aria-label="Ubicación"
          >
            <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </a>
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
          <div className="grid grid-cols-1 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
                onIncrement={increment}
                onDecrement={decrement}
                quantity={items.find((i) => i.productId === product.id)?.quantity || 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}