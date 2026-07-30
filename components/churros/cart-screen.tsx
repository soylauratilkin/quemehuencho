"use client"

import { useState } from "react"
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/menu-data"
import { categoryIcon } from "./category-icons"
import { useStore } from "./store"

const WEBHOOK_URL = "/api/order";

// Componente Row para el resumen
function Row({ label, value, isText, strong }: { label: string; value: string; isText?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold text-black ${isText ? "text-sm" : ""} ${strong ? "text-lg" : ""}`}>
        {value}
      </span>
    </div>
  )
}

export function CartScreen() {
  // Agregamos clearCart o placeOrder según lo que tengas en tu store
  const { items, increment, decrement, removeItem, setScreen, clearCart, placeOrder } = useStore()
  
  const esMesa = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mesa") !== null
  const numeroMesa = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mesa") : ""
  
  const [enviando, setEnviando] = useState(false)

  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.price) || 0
    const qty = Number(item.quantity) || 0
    return acc + (price * qty)
  }, 0)

  const total = subtotal

  // 🚀 FUNCIÓN PARA ENVIAR PEDIDO DE MESA DIRECTAMENTE
  const handleConfirmarPedidoMesa = async () => {
    setEnviando(true)
    const orderId = "QMH-" + Date.now()

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          phone: "", // No hace falta para mesas
          address: `Mesa ${numeroMesa}`, // Usamos la mesa como "dirección"
          total: Math.round(total),
          items: items,
          notes: `Pedido desde Mesa ${numeroMesa}`,
          type: "Mesa",
          distanceKm: 0,
          deliveryFee: 0,
          origen: "mesa" // 🔑 Clave para que el admin lo pinte violeta
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Error desconocido")
      }

      // ¡ÉXITO! Limpiar carrito y mostrar pantalla de éxito
      const detallesMesa = {
        address: `Mesa ${numeroMesa}`,
        notes: `Pedido desde Mesa ${numeroMesa}`,
        phone: "",
        distanceKm: 0,
        deliveryFee: 0,
        paymentMethod: "Efectivo" // O el método que uses por defecto
      }
      
      placeOrder(detallesMesa, orderId)

    } catch (error) {
      console.error("Error enviando pedido:", error)
      alert("Hubo un error al enviar el pedido. Por favor, avisale a un mozo.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col pb-32 bg-[#0a0a0a]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-[#333] bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => setScreen("home")}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-[#1a1a1a] text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-heading text-xl font-semibold text-white">
          {esMesa ? `Mesa ${numeroMesa}` : "Tu pedido"}
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-[#1a1a1a] text-[#ff751f]">
            <ShoppingBag className="size-9" />
          </div>
          <p className="text-pretty text-lg font-bold text-white">Tu carrito está vacío</p>
          <button onClick={() => setScreen("home")} className="mt-2 h-12 rounded-full bg-[#ff751f] px-6 font-bold text-black">
            Ver el menú
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 px-4 pt-4">
            <ul className="space-y-3">
              {items.map((item) => {
                const Icon = categoryIcon[item.category]
                const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0)
                
                return (
                  <li key={item.lineId} className="flex gap-3 rounded-3xl bg-[#111] p-3 shadow-sm ring-1 ring-[#333]">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#1a1a1a] overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        Icon ? <Icon className="size-7 text-[#ff751f]" /> : <ShoppingBag className="size-7 text-[#ff751f]" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-pretty font-bold leading-snug text-white">{item.name}</h3>
                        <button onClick={() => removeItem(item.lineId)} className="text-gray-500 active:text-red-500">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">{formatPrice(Number(item.price) || 0)} c/u</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 rounded-full bg-[#1a1a1a] p-1">
                          <button onClick={() => decrement(item.lineId)} className="flex size-8 items-center justify-center rounded-full bg-[#0a0a0a] text-white">
                            <Minus className="size-4" />
                          </button>
                          <span className="w-5 text-center font-bold tabular-nums text-white">{item.quantity}</span>
                          <button onClick={() => increment(item.lineId)} className="flex size-8 items-center justify-center rounded-full bg-[#ff751f] text-black">
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <span className="font-extrabold tabular-nums text-white">{formatPrice(itemTotal)}</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* RESUMEN: OCULTO PARA MESAS */}
            {!esMesa && (
              <div className="mt-6 space-y-2 rounded-3xl bg-[#ff751f] p-4 shadow-lg ring-2 ring-[#ff751f]">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                <Row label="Envío" value="A calcular en el siguiente paso" isText />
                <div className="my-1 border-t border-dashed border-black/30" />
                <Row label="Total (sin envío)" value={formatPrice(total)} strong />
              </div>
            )}
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t-2 border-[#ff751f] bg-[#ff751f] px-4 py-4 shadow-2xl">
            <button
              onClick={esMesa ? handleConfirmarPedidoMesa : () => setScreen("checkout")}
              disabled={enviando}
              className="flex h-14 w-full items-center justify-between rounded-full bg-black px-6 font-bold text-[#ff751f] transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <span>{enviando ? "Enviando..." : (esMesa ? "Confirmar Pedido" : "Continuar")}</span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}