"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, LocateFixed, MapPin, Copy, Check, Navigation } from "lucide-react"
import { formatPrice, calcularPrecioEnvio, fetchConfig, DEFAULT_CONFIG } from "@/lib/menu-data"
import { useStore } from "./store"

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
  const [addressModified, setAddressModified] = useState(false)

  useEffect(() => {
    fetchConfig().then(setConfig)
  }, [])

  // Si el usuario modifica la dirección, resetear distancia y costo
  useEffect(() => {
    if (addressModified && deliveryFee > 0) {
      setDeliveryFee(0)
      setDistanceKm(0)
      setFoundAddress("")
      setError("⚠️ Modificaste la dirección. Por favor, volvé a calcular el envío.")
    }
  }, [address])

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

  async function calcularDistanciaDesdeGPS(lat: number, lng: number) {
    try {
      const response = await fetch(`/api/distance?lat=${lat}&lng=${lng}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(`❌ ${errorData.error || "No se pudo calcular"}`)
        return null
      }

      const data = await response.json()
      setFoundAddress(data.direccionEncontrada || "")
      setAddress(data.direccionEncontrada || "")
      return data.distancia
    } catch (error) {
      console.error("Error calculando distancia desde GPS:", error)
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
      setAddressModified(false) // Resetear flag
      
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

  async function handleUsarMiUbicacion() {
    setIsCalculating(true)
    setError("")
    setFoundAddress("")

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.")
      setIsCalculating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        try {
          const distancia = await calcularDistanciaDesdeGPS(lat, lng)
          
          if (distancia === null) {
            setIsCalculating(false)
            return
          }

          setDistanceKm(distancia)
          setAddressModified(false)
          
          const fee = calcularPrecioEnvio(distancia)
          if (fee) {
            setDeliveryFee(fee)
          } else {
            setError(`Estás a ${distancia.toFixed(1)} km, fuera de nuestra zona de delivery.`)
          }
        } catch (err) {
          setError("Error al calcular la distancia. Intentá de nuevo.")
        }
        
        setIsCalculating(false)
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error)
        setError("No pudimos obtener tu ubicación. Asegurate de dar permisos de ubicación.")
        setIsCalculating(false)
      }
    )
  }

  function copiarAlias() {
    navigator.clipboard.writeText(config.alias_mercadopago)
    setCopiedAlias(true)
    setTimeout(() => setCopiedAlias(false), 2000)
  }

async function acortarLink(url: string): Promise<string> {
  try {
    // Intentar con is.gd primero
    const response = await fetch(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`
    )
    const shortUrl = await response.text()
    if (shortUrl.startsWith("http") && shortUrl.length < url.length) {
      return shortUrl.trim()
    }
    // Si falla, intentar con tinyurl
    const response2 = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    )
    const shortUrl2 = await response2.text()
    if (shortUrl2.startsWith("http") && shortUrl2.length < url.length) {
      return shortUrl2.trim()
    }
    return url
  } catch {
    return url
  }
}

function limpiarDireccion(direccionCompleta: string): string {
  if (!direccionCompleta) return ""
  
  // La dirección viene como: "Gales 2233, U9120 Puerto Madryn, Chubut, Argentina"
  // Queremos solo: "Gales 2233, Puerto Madryn"
  
  const partes = direccionCompleta.split(",").map(p => p.trim())
  
  // Primera parte: calle y número (la dejamos tal cual)
  const calle = partes[0] || ""
  
  // Buscar "Puerto Madryn" en alguna parte
  const ciudad = partes.find(p => 
    p.toLowerCase().includes("puerto madryn") || 
    p.toLowerCase().includes("madryn")
  ) || "Puerto Madryn"
  
  // Limpiar el código postal (U9120, H9120, etc.)
  const ciudadLimpia = ciudad.replace(/U?\d{4}\s*/i, "").trim()
  
  return `${calle}, ${ciudadLimpia}`
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
  const now = new Date().toLocaleString("es-AR", { 
    day: "2-digit", 
    month: "2-digit", 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false // Sin AM/PM
  }).replace(",", "") // Quita la coma
  
  const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`
  const direccionLimpia = limpiarDireccion(foundAddress) || address
  
  // Links de confirmación (acortados)
  const linkTransferencia = await acortarLink(
    `https://wa.me/${config.telefono_quemehuencho}?text=${encodeURIComponent(
      `Transferencia pedido ${orderId} ${formatPrice(total)}`
    )}`
  )
  
  const linkEfectivo = await acortarLink(
    `https://wa.me/${config.telefono_quemehuencho}?text=${encodeURIComponent(
      `Efectivo pedido ${orderId} ${formatPrice(total)}`
    )}`
  )

  const mensaje = `🚀 *NUEVO PEDIDO* 🚀
🕒 ${now} ${orderId}

📍 *Entrega:* ${direccionLimpia}
📱 ${phone}
📏 ${distanceKm.toFixed(1)} km

📦 ${itemsList}

💵 Subtotal: ${formatPrice(subtotal)}
🏍️ Envío: ${formatPrice(deliveryFee)}
💰 *TOTAL: ${formatPrice(total)}*
${notes ? `\n📝 ${notes}` : ""}

💳 *PAGO:*
🏦 Alias: *${config.alias_mercadopago}*
(${config.nombre_titular_alias})

💵 Efectivo: ${linkEfectivo}
🏦 Transferencia: ${linkTransferencia}`

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
            {address && !addressModified && (
              <p className="text-xs font-semibold text-add">
                💾 Recordamos tu dirección anterior.
              </p>
            )}
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setAddressModified(true)
              }}
              placeholder="Calle y número (ej: Gales 2233)"
              className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu WhatsApp (ej: 2804123456)"
              className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            
            {/* Botones de cálculo */}
            <div className="space-y-2">
              <button
                onClick={handleCalcularEnvio}
                disabled={isCalculating}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 text-sm font-bold text-primary disabled:opacity-50"
              >
                <LocateFixed className="size-4" />
                {isCalculating ? "Calculando ruta..." : "Calcular desde dirección"}
              </button>
              
              <button
                onClick={handleUsarMiUbicacion}
                disabled={isCalculating}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-add/30 bg-add/5 text-sm font-bold text-add disabled:opacity-50"
              >
                <Navigation className="size-4" />
                {isCalculating ? "Obteniendo ubicación..." : "Usar mi ubicación actual (GPS)"}
              </button>
            </div>
            
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