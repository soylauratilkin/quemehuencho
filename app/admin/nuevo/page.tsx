"use client"

import { useEffect, useState } from "react"
import { ShoppingBag, Plus, Minus, Check } from "lucide-react"
import { CategorySelector, type CategoryId } from "@/components/churros/category-selector"
import { fetchProductsFromGoogleSheet, MENU_CSV_URL, formatPrice, type Product } from "@/lib/menu-data"

type Ubicacion = "Mostrador" | "Mesa 1" | "Mesa 2" | "Mesa 3" | "Mesa 4" | "Mesa 5" | "Baúl"

const UBICACIONES: Ubicacion[] = ["Mostrador", "Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Baúl"]

type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

export default function NuevoPedidoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("combos")
  const [ubicacion, setUbicacion] = useState<Ubicacion>("Mostrador")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetched = await fetchProductsFromGoogleSheet(MENU_CSV_URL)
        setProducts(fetched)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  const filteredProducts = products.filter((p) => p.category === selectedCategory)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }]
    })
  }

  function increment(id: string) {
    setCart((prev) => prev.map((i) => i.productId === id ? { ...i, quantity: i.quantity + 1 } : i))
  }

  function decrement(id: string) {
    setCart((prev) => prev.map((i) => i.productId === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0))
  }

  const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0)

  async function confirmarPedido() {
    if (cart.length === 0) {
      alert("Agregá al menos un producto")
      return
    }

    setIsSending(true)
    const orderId = `QMH-${Date.now()}`
    const detalle = cart.map((i) => `${i.quantity}x ${i.name}`).join(" | ")

    try {
      const response = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nuevoPedidoLocal",
          id: orderId,
          origen: "local",
          ubicacion: ubicacion,
          total: Math.round(total),
          items: cart,
          detalle: detalle
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setSuccess(true)
        setCart([])
        
        // Forzar recarga de pedidos en el dashboard
        // (si estás en la misma pestaña, redirigir a pedidos)
        setTimeout(() => {
          router.push("/admin/pedidos?refresh=" + Date.now())
        }, 1500)
      }
    } catch (e) {
      console.error(e)
      alert("Error de conexión")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Nuevo Pedido</h1>
          <p className="mt-1 text-sm text-gray-400">Tomá un pedido para el local</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-black font-bold animate-in zoom-in">
            <Check className="size-5" /> ¡Guardado!
          </div>
        )}
      </div>

      {/* SELECTOR DE UBICACIÓN */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Ubicación</h2>
        <div className="grid grid-cols-4 gap-2">
          {UBICACIONES.map((ub) => (
            <button
              key={ub}
              onClick={() => setUbicacion(ub)}
              className={`rounded-xl px-3 py-3 text-sm font-bold transition-all ${
                ubicacion === ub
                  ? "bg-[#ff751f] text-black shadow-lg"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              {ub}
            </button>
          ))}
        </div>
      </section>

      {/* CATEGORÍAS (incluye "local") */}
      <section className="mb-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Categoría</h2>
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showLocal={true}
        />
      </section>

      {/* PRODUCTOS */}
      <section className="mb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff751f] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((i) => i.productId === product.id)
              const qty = cartItem?.quantity || 0
              return (
                <div key={product.id} className="relative overflow-hidden rounded-2xl bg-[#111] ring-1 ring-[#333]">
                  {product.image && (
                    <img src={product.image} alt={product.name} className="h-24 w-full object-cover" />
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#ff751f]">{formatPrice(product.price)}</span>
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(product)}
                          className="flex size-8 items-center justify-center rounded-full bg-[#ff751f] text-black"
                        >
                          <Plus className="size-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-[#ff751f] p-1">
                          <button onClick={() => decrement(product.id)} className="flex size-6 items-center justify-center rounded-full bg-black text-white">
                            <Minus className="size-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-black text-black">{qty}</span>
                          <button onClick={() => increment(product.id)} className="flex size-6 items-center justify-center rounded-full bg-black text-white">
                            <Plus className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* BARRA FLOTANTE DE CONFIRMACIÓN */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-64 right-0 z-50 border-t-2 border-[#ff751f] bg-[#ff751f] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-black/70">Pedido para {ubicacion}</p>
              <p className="text-lg font-extrabold text-black">{itemCount} items · {formatPrice(total)}</p>
            </div>
            <button
              onClick={confirmarPedido}
              disabled={isSending}
              className="flex h-14 items-center gap-2 rounded-full bg-black px-8 font-bold text-[#ff751f] transition-transform active:scale-95 disabled:opacity-50"
            >
              <ShoppingBag className="size-5" />
              {isSending ? "Guardando..." : "Confirmar Pedido"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}