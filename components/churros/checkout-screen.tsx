"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, LocateFixed, MapPin, Copy, Check } from "lucide-react"
import { formatPrice, calcularPrecioEnvio, fetchConfig, DEFAULT_CONFIG } from "@/lib/menu-data"
import { useStore } from "./store"
import { cn } from "@/lib/utils"

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyzaKEUKzMuCSNiuzcvBFCtebPXgrpqyugjZTzTgpp_ZCuG5hWrd79FZOoK5ODccyvVhQ/exec";

export function CheckoutScreen() {
  const { subtotal, items, placeOrder, setScreen, orderDetails, setOrderDetails } = useStore()
  
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

  const [notes, setNotes] = useState(orderDetails?.notes || "")
  const [isCalculating, setIsCalculating] = useState(false)
  const [distanceKm, setDistanceKm] = useState(orderDetails?.distanceKm || 0)
  const [deliveryFee, setDeliveryFee] = useState(orderDetails?.deliveryFee || 0)
  const [error, setError] = useState("")
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [copiedAlias, setCopiedAlias] = useState(false)
  const [foundAddress, setFoundAddress] = useState("")

  useEffect(() => {
    fetchConfig().then(setConfig)
  }, [])

  const total = subtotal + deliveryFee

  async function calcularDistanciaReal(direccionDestino: string) {
    try {
      const response = await fetch(
        `/api/distance?destino=${encodeURIComponent(direccionDestino)}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(`❌ ${errorData.error || "No se pudo calcular"}`)
        return null
      }

      const data = await response.json()
      setFoundAddress(data.direccionEncontrada || "")
      return data.distancia
    } catch (error) {
      console.error("Error calculando distancia:", error)
      setError("Error de conexión. Intentá de nuevo.")
      return null
    }
  }

  async function handleCalcularEnvio() {
    setIsCalculating(true)
    setError("")
    setFoundAddress("")

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
        setError(`Estás a ${distancia.toFixed(1)} km, fuera de nuestra zona de delivery (máx 10 km).`)
      }
    } catch (err) {
      setError("Error al calcular la distancia. Intentá de nuevo.")
    }
    
    setIsCalculating(false)
  }

  function copiarAlias() {
    navigator.clipboard.writeText(config.alias_mercadopago)
    setCopiedAlias(true)
    setTimeout(() => setCopiedAlias(false), 2000)
  }

  async function handlePlaceOrder() {
    if (!address || !phone) {
      alert("Por favor, completá tu dirección y teléfono.")
      return
    }
    if (deliveryFee === 0 && !error) {
      alert("Por favor, calculá el costo de envío primero.")
      return
    }

    localStorage.setItem("qh_address", address)
    localStorage.setItem("qh_phone", phone)
    localStorage.setItem("qh_last_order", new Date().toISOString())

    const details = { address, phone, distanceKm, deliveryFee, paymentMethod: "A definir", notes }
    setOrderDetails(details)
    placeOrder(details)
    
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

    setTimeout(async () => {
      const itemsList = items.map((i) => `• ${i.quantity}x ${i.name}`).join("\n")
      const now = new Date().toLocaleString("es-AR")
      const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`
      
      // Link para que el cliente avise cuando pagó por transferencia
      const linkConfirmarPago = `https://wa.me/${config.telefono_quemehuencho}?text=${encodeURIComponent(
        `Hola! Ya transferí el pago del pedido ${orderId} por $${total.toFixed(0)} 🙌`
      )}`

      const mensaje = `🚀 *NUEVO PEDIDO* 🚀

🆔 *ID:* ${orderId}
🕒 ${now}

📦 *DETALLES DEL ENVÍO*
━━━━━━━━━━━━━━━━
🏪 *PUNTO DE RETIRO*
📍 ${config.direccion_local}

🏠 *PUNTO DE ENTREGA*
📍 ${address}
📱 ${phone}
📏 Distancia: ${distanceKm.toFixed(1)} km
${foundAddress ? `📍 Verificado: ${foundAddress}` : ''}

📦 *Pedido:*
${itemsList}
Subtotal: ${formatPrice(subtotal)}

🏍️ Envío: *${formatPrice(deliveryFee)}*
💰 *TOTAL: ${formatPrice(total)}*
📝 Notas: ${notes || "Ninguna"}

━━━━━━━━━━━━━━━━
💳 *FORMAS DE PAGO*
━━━━━━━━━━━━━━━━
💵 *EFECTIVO:* Pagás al recibir
🏦 *TRANSFERENCIA:*
   Alias: *${config.alias_mercadopago}*
   Titular: ${config.nombre_titular_alias}
   
👉 Si transferís, avisame tocando acá:
${linkConfirmarPago}

⚠️ _El local confirmará la recepción del pedido a la brevedad._`

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
        {/* DIRECCIÓN Y CÁLCULO */}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Dirección de entrega</h2>
          <div className="space-y-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
            {address && (
              <p className="text-xs font-semibold text-add">
                💾 Recordamos tu dirección anterior.
              </p>
            )}
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle y número (ej: Gales 2233)"
              className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu WhatsApp (ej: 2804123456)"
              className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleCalcularEnvio}
              disabled={isCalculating}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 text-sm font-bold text-primary disabled:opacity-50"
            >
              <LocateFixed className="size-4" />
              {isCalculating ? "Calculando ruta..." : "Calcular costo de envío"}
            </button>
            
            {foundAddress && !error && (
              <div className="flex items-start gap-2 rounded-2xl bg-add/10 p-3 text-xs">
                <MapPin className="size-4 shrink-0 text-add mt-0.5" />
                <span className="text-add"><strong>Encontramos:</strong> {foundAddress}</span>
              </div>
            )}
            
            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
            
            {deliveryFee > 0 && !error && (
              <div className="flex items-center justify-between rounded-2xl bg-add p-3">
                <span className="text-sm font-bold text-add-foreground">Envío ({distanceKm.toFixed(1)} km)</span>
                <span className="text-base font-extrabold text-add-foreground">{formatPrice(deliveryFee)}</span>
              </div>
            )}
          </div>
        </section>

        {/* ALIAS DE PAGO */}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Formas de pago</h2>
          <div className="space-y-2">
            <div className="rounded-2xl border border-add/30 bg-add/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-add text-add-foreground">
                  💵
                </span>
                <div>
                  <p className="font-bold text-foreground">Efectivo al recibir</p>
                  <p className="text-xs text-muted-foreground">Pagás cuando llegue el pedido</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-add/30 bg-add/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-add text-add-foreground">
                  🏦
                </span>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Transferencia / Mercado Pago</p>
                  <p className="text-xs text-muted-foreground mb-2">Alias:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-background px-3 py-2 text-sm font-mono font-bold text-foreground">
                      {config.alias_mercadopago}
                    </code>
                    <button
                      onClick={copiarAlias}
                      className="flex size-10 items-center justify-center rounded-lg bg-add text-add-foreground"
                      aria-label="Copiar alias"
                    >
                      {copiedAlias ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Titular: {config.nombre_titular_alias}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NOTAS */}
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
          disabled={!deliveryFee || !!error}
          className="flex h-14 w-full items-center justify-center rounded-full bg-add text-base font-bold text-add-foreground transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirmar y Enviar Pedido
        </button>
      </div>
    </div>
  )
}