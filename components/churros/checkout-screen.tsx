"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Banknote, CreditCard, Link2, LocateFixed } from "lucide-react"
import { formatPrice, calcularPrecioEnvio, fetchConfig, DEFAULT_CONFIG } from "@/lib/menu-data"
import { useStore } from "./store"
import { cn } from "@/lib/utils"

const payments = [
  { id: "Efectivo", label: "Efectivo", note: "Pagás al recibir", icon: Banknote },
  { id: "Mercado Pago", label: "Mercado Pago", note: "Te enviamos el link", icon: Link2 },
  { id: "Transferencia", label: "Transferencia", note: "Compartinos el comprobante", icon: CreditCard },
]

// ⚠️ PEGÁ ACÁ LA URL DE TU APPS SCRIPT (la que termina en /exec)
const WEBHOOK_URL = ""

export function CheckoutScreen() {
  const { subtotal, items, placeOrder, setScreen, orderDetails, setOrderDetails } = useStore()
  
  // 1. Cargar datos guardados del navegador (LocalStorage)
  const [address, setAddress] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("qh_address") || orderDetails?.address || ""
    }
    return orderDetails?.address || ""
  })
  
  const [phone, setPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("qh_phone") || orderDetails?.phone || ""
    }
    return orderDetails?.phone || ""
  })

  const [payment, setPayment] = useState(orderDetails?.paymentMethod || "Transferencia")
  const [notes, setNotes] = useState(orderDetails?.notes || "")
  const [isCalculating, setIsCalculating] = useState(false)
  const [distanceKm, setDistanceKm] = useState(orderDetails?.distanceKm || 0)
  const [deliveryFee, setDeliveryFee] = useState(orderDetails?.deliveryFee || 0)
  const [error, setError] = useState("")
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  useEffect(() => {
    fetchConfig().then(setConfig)
  }, [])

  const total = subtotal + deliveryFee

  // 2. Calcular distancia con OpenStreetMap (gratis)
  async function calcularDistanciaReal(direccionDestino: string): Promise<number | null> {
    try {
      const response = await fetch(
        `/api/distance?destino=${encodeURIComponent(direccionDestino)}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en la API:", errorData)
        setError(`Error: ${errorData.error || "No se pudo calcular"}`)
        return null
      }

      const data = await response.json()
      return data.distancia
    } catch (error) {
      console.error("Error calculando distancia:", error)
      setError("Error de conexión. Intentá de nuevo.")
      return null
    }
  }

  async function useMyLocation() {
    setIsCalculating(true)
    setError("")

    if (!address.trim()) {
      setError("Primero escribí tu dirección arriba.")
      setIsCalculating(false)
      return
    }

    try {
      const distancia = await calcularDistanciaReal(address)
      
      if (distancia === null) {
        setIsCalculating(false)
        return
      }

      setDistanceKm(distancia)
      
      const fee = calcularPrecioEnvio(distancia)
      if (fee) {
        setDeliveryFee(fee)
      } else {
        setError("Lo sentimos, estás fuera de nuestra zona de delivery (máx 10 km).")
      }
    } catch (err) {
      setError("Error al calcular la distancia. Intentá de nuevo.")
    }
    
    setIsCalculating(false)
  }

  async function acortarLink(url: string): Promise<string> {
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
      const shortUrl = await response.text()
      return shortUrl.startsWith("http") ? shortUrl : url
    } catch {
      return url
    }
  }

  // 3. Función principal: confirmar pedido
  async function handlePlaceOrder() {
    console.log("🔍 Iniciando handlePlaceOrder...");
    console.log("📍 Dirección:", address);
    console.log("📱 Teléfono:", phone);
    console.log("💰 Delivery Fee:", deliveryFee);
    
    if (!address || !phone) {
      alert("Por favor, completá tu dirección y teléfono.")
      return
    }
    if (deliveryFee === 0 && !error) {
      alert("Por favor, calculá el costo de envío primero.")
      return
    }

    // GUARDAR EN EL NAVEGADOR DEL CLIENTE (con logs)
    try {
      localStorage.setItem("qh_address", address)
      localStorage.setItem("qh_phone", phone)
      localStorage.setItem("qh_last_order", new Date().toISOString())
      
      console.log("✅ Datos guardados en localStorage:");
      console.log("  - Dirección:", localStorage.getItem("qh_address"));
      console.log("  - Teléfono:", localStorage.getItem("qh_phone"));
      console.log("  - Fecha:", localStorage.getItem("qh_last_order"));
    } catch (err) {
      console.error("❌ Error guardando en localStorage:", err);
    }

    const details = { address, phone, distanceKm, deliveryFee, paymentMethod: payment, notes }
    setOrderDetails(details)
    placeOrder(details)
    
    // ENVIAR A GOOGLE SHEETS (en segundo plano, no bloquea la app)
    if (WEBHOOK_URL) {
      const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`
      fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          phone: phone,
          address: address,
          total: formatPrice(total),
          items: items
        })
      }).catch(err => console.error("Error guardando en Sheets:", err))
    }

    // ABRIR WHATSAPP AUTOMÁTICAMENTE
    setTimeout(async () => {
      const itemsList = items.map((i) => `• ${i.quantity}x ${i.name}`).join("\n")
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Puerto Madryn")}`
      const shortMapLink = await acortarLink(mapLink)
      const now = new Date().toLocaleString("es-AR")
      const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`

      const mensaje = `🚀 *PEDIDO CONFIRMADO* 🚀

📦 *DETALLES DEL ENVÍO*
━━━━━━━━━━━━━━━━
🏪 *PUNTO DE RETIRO*
📍 ${config.direccion_local}
📱 ${config.telefono_quemehuencho}

🏠 *PUNTO DE ENTREGA*
📍 ${address}
📱 ${phone}
👌 *DETALLES*
📏 Distancia: ${distanceKm.toFixed(1)} km

📦 *Pedido:*
${itemsList}
Subtotal: ${formatPrice(subtotal)}

🏍️ Envío: *${formatPrice(deliveryFee)}*
💰 *Total: ${formatPrice(total)}*
💳 Método: ${payment}
📝 Notas: ${notes || "Ninguna"}

🗺️ *MAPA*
${shortMapLink}

🆔 ID: ${orderId}
🕒 ${now}`

      const url = `https://wa.me/${config.telefono_quemehuencho}?text=${encodeURIComponent(mensaje)}`
      window.open(url, "_blank", "noopener,noreferrer")
    }, 500)
  }

  return (
    <div className="flex min-h-dvh flex-col pb-44">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <button onClick={() => setScreen("cart")} className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-heading text-xl font-semibold text-foreground">Finalizar pedido</h1>
      </header>

      <div className="space-y-6 px-4 pt-5">
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Dirección de entrega</h2>
          <div className="space-y-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
            {address && (
              <p className="text-xs font-semibold text-add">
                💾 Recordamos tu dirección anterior. Si cambió, modificala abajo.
              </p>
            )}
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número y depto"
              className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu número de WhatsApp (ej: 2804123456)"
              className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={useMyLocation}
              disabled={isCalculating}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 text-sm font-bold text-primary disabled:opacity-50"
            >
              <LocateFixed className="size-4" />
              {isCalculating ? "Calculando..." : "Calcular envío"}
            </button>
            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
            {deliveryFee > 0 && !error && (
              <p className="text-sm font-bold text-add">✅ Costo de envío: {formatPrice(deliveryFee)} ({distanceKm.toFixed(1)} km)</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Método de pago</h2>
          <div className="space-y-2">
            {payments.map((opt) => {
              const Icon = opt.icon
              const active = payment === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setPayment(opt.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                    active ? "border-add bg-add/5" : "border-border bg-card"
                  )}
                >
                  <span className={cn("flex size-10 items-center justify-center rounded-full", active ? "bg-add text-add-foreground" : "bg-secondary text-primary")}>
                    <Icon className="size-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.note}</span>
                  </span>
                  <span className={cn("size-5 rounded-full border-2", active ? "border-add bg-add" : "border-border")} />
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Instrucciones especiales</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ej: tocar timbre, sin azúcar, etc."
            className="w-full resize-none rounded-2xl bg-card p-4 text-sm font-medium text-foreground shadow-sm outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-card px-4 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total a pagar</span>
          <span className="text-lg font-extrabold tabular-nums text-foreground">{formatPrice(total)}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          className="flex h-14 w-full items-center justify-center rounded-full bg-add text-base font-bold text-add-foreground transition-transform active:scale-[0.98]"
        >
          Confirmar y Generar Pedido
        </button>
      </div>
    </div>
  )
}