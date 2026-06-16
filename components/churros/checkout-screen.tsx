"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, LocateFixed, MapPin, Copy, Check, Navigation, Store } from "lucide-react"
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
  const [pickupInStore, setPickupInStore] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Estados para la pantalla de éxito
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState("")
  const [orderSummary, setOrderSummary] = useState({ id: "", time: "", total: 0 })

  useEffect(() => {
    fetchConfig().then(setConfig)
  }, [])

  // TRUCO INFALIBLE: Cuando orderConfirmed se vuelve true, abrimos WhatsApp
  useEffect(() => {
    if (orderConfirmed && lastWhatsappUrl) {
      // Pequeño delay para asegurar que el navegador ya renderizó la pantalla de éxito
      const timer = setTimeout(() => {
        window.open(lastWhatsappUrl, "_blank", "noopener,noreferrer")
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [orderConfirmed, lastWhatsappUrl])

  useEffect(() => {
    if (addressModified && deliveryFee > 0 && !pickupInStore) {
      setDeliveryFee(0)
      setDistanceKm(0)
      setFoundAddress("")
      setError("⚠️ Modificaste la dirección. Volvé a calcular el envío.")
    }
  }, [address])

  const total = subtotal + (pickupInStore ? 0 : deliveryFee)

  async function calcularDistanciaReal(direccionDestino: string) {
    try {
      const response = await fetch(`/api/distance?destino=${encodeURIComponent(direccionDestino)}`)
      if (!response.ok) {
        const errorData = await response.json()
        setError(`❌ ${errorData.error || "No se pudo calcular"}`)
        return null
      }
      const data = await response.json()
      setFoundAddress(data.direccionEncontrada || "")
      return data.distancia
    } catch (error) {
      setError("Error de conexión. Intentá de nuevo.")
      return null
    }
  }

  async function handleCalcularEnvio() {
    setIsCalculating(true)
    setError("")
    setFoundAddress("")

    if (!address.trim()) {
      setError("Primero escribí tu dirección.")
      setIsCalculating(false)
      return
    }

    const distancia = await calcularDistanciaReal(address)
    if (distancia !== null) {
      setDistanceKm(distancia)
      setAddressModified(false)
      const fee = calcularPrecioEnvio(distancia)
      if (fee) {
        setDeliveryFee(fee)
      } else {
        setError(`Estás a ${distancia.toFixed(1)} km, fuera de nuestra zona (máx 10 km).`)
      }
    }
    setIsCalculating(false)
  }

  function copiarAlias() {
    navigator.clipboard.writeText(config.alias_mercadopago)
    setCopiedAlias(true)
    setTimeout(() => setCopiedAlias(false), 2000)
  }

  async function acortarLink(url: string): Promise<string> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const response = await fetch(`/api/shorten?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      clearTimeout(timeoutId)
      const data = await response.json()
      return (data.shortUrl && data.shortUrl.length < url.length) ? data.shortUrl : url
    } catch {
      return url
    }
  }

  function limpiarDireccion(direccionCompleta: string): string {
    if (!direccionCompleta) return ""
    const partes = direccionCompleta.split(",").map(p => p.trim())
    const calle = partes[0] || ""
    const ciudad = partes.find(p => p.toLowerCase().includes("madryn")) || "Puerto Madryn"
    return `${calle}, ${ciudad.replace(/U?\d{4}\s*/i, "").trim()}`
  }

  async function handlePlaceOrder() {
    if (!phone) {
      alert("Por favor, completá tu teléfono.")
      return
    }
    if (!pickupInStore && (!address || deliveryFee === 0)) {
      alert("Por favor, calculá el costo de envío primero.")
      return
    }

    setIsSending(true)

    // 1. Guardar en localStorage
    localStorage.setItem("qh_address", pickupInStore ? "" : address)
    localStorage.setItem("qh_phone", phone)
    localStorage.setItem("qh_last_order", new Date().toISOString())

    // 2. Guardar en el estado de la app
    const details = { 
      address: pickupInStore ? "Retiro en local" : address, 
      phone, 
      distanceKm: pickupInStore ? 0 : distanceKm, 
      deliveryFee: pickupInStore ? 0 : deliveryFee, 
      paymentMethod: "A definir", 
      notes: pickupInStore ? `${notes} (RETIRA EN LOCAL)` : notes 
    }
    setOrderDetails(details)
    placeOrder(details)
    
    // 3. Enviar a Google Sheets
    if (WEBHOOK_URL) {
      const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`
      fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          phone: phone,
          address: details.address,
          total: Math.round(total), // Número entero
          items: items
        })
      }).catch(err => console.error("Webhook error:", err))
    }

    // 4. Generar mensaje y preparar pantalla de éxito
    try {
      const itemsList = items.map((i) => `• ${i.quantity}x ${i.name}`).join("\n")
      const now = new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "")
      const direccionLimpia = pickupInStore ? "Retiro en local" : (limpiarDireccion(foundAddress) || address)
      
      const mapLink = pickupInStore ? "" : await acortarLink(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(config.direccion_local)}&destination=${encodeURIComponent(direccionLimpia)}&travelmode=driving`
      )
      
      const linkTransferencia = await acortarLink(
        `https://wa.me/${config.telefono_quemehuencho}?text=${encodeURIComponent(`Transferencia pedido ${formatPrice(total)}`)}`
      )
      
      const linkEfectivo = await acortarLink(
        `https://wa.me/${config.telefono_quemehuencho}?text=${encodeURIComponent(`Efectivo pedido ${formatPrice(total)}`)}`
      )

      const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`
      const mensaje = `🚀 *NUEVO PEDIDO*

🆔 *ID:* ${orderId}
🕒 ${now}

🏪 *Retiro:* ${config.direccion_local}
${!pickupInStore ? `🏠 *Entrega:* ${direccionLimpia}\n📱 ${phone} | 📏 ${distanceKm.toFixed(1)} km\n\n🗺️ Ruta: ${mapLink}` : `📱 ${phone}`}

📦 ${itemsList}

💵 ${formatPrice(subtotal)}${!pickupInStore ? ` + 🏍️ ${formatPrice(deliveryFee)}` : ""}
💰 *TOTAL: ${formatPrice(total)}*
${notes ? `📝 ${notes}` : ""}

💳 Alias: *${config.alias_mercadopago}*
💵 Efectivo: ${linkEfectivo}
🏦 Transferencia: ${linkTransferencia}`

      const url = `https://wa.me/${config.telefono_quemehuencho}?text=${encodeURIComponent(mensaje)}`
      
      // ACTUALIZAR ESTADO PRIMERO (Esto fuerza a React a mostrar la pantalla de éxito)
      setOrderSummary({ id: orderId, time: now, total })
      setLastWhatsappUrl(url)
      setOrderConfirmed(true)
      
    } catch (error) {
      console.error("Error al generar mensaje:", error)
      // Aunque falle, mostramos la pantalla de éxito
      setOrderSummary({ id: "Error", time: new Date().toLocaleTimeString(), total })
      setOrderConfirmed(true)
    } finally {
      setIsSending(false)
    }
  }

  // ==========================================
  // PANTALLA DE ÉXITO
  // ==========================================
  if (orderConfirmed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-add text-add-foreground animate-in zoom-in duration-300">
          <Check className="size-10" />
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">¡Pedido Confirmado!</h1>
        <p className="mb-8 text-muted-foreground">Tu pedido fue registrado exitosamente.</p>
        
        <div className="mb-8 w-full max-w-sm rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border text-left">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">ID del Pedido</span>
            <span className="font-mono font-bold text-foreground">{orderSummary.id}</span>
          </div>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">Hora</span>
            <span className="font-bold text-foreground">{orderSummary.time}</span>
          </div>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-extrabold text-add">{formatPrice(orderSummary.total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            <span className="rounded-full bg-add/10 px-3 py-1 text-xs font-bold text-add">Enviado a WhatsApp</span>
          </div>
        </div>

        <button
          onClick={() => window.open(lastWhatsappUrl, "_blank", "noopener,noreferrer")}
          className="mb-4 flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-add text-base font-bold text-add-foreground transition-transform active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-current">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.578-.985zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Abrir Chat de WhatsApp
        </button>

        <button
          onClick={() => {
            setOrderConfirmed(false)
            setScreen("home")
          }}
          className="flex h-12 w-full max-w-sm items-center justify-center rounded-full bg-secondary text-base font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Volver al Inicio
        </button>
      </div>
    )
  }

  // ==========================================
  // PANTALLA DE CHECKOUT NORMAL
  // ==========================================
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
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Modo de entrega</h2>
          <div className="space-y-2">
            <button onClick={() => setPickupInStore(false)} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${!pickupInStore ? "border-add bg-add/5" : "border-border bg-card"}`}>
              <span className={`flex size-10 items-center justify-center rounded-full ${!pickupInStore ? "bg-add text-add-foreground" : "bg-secondary text-primary"}`}>
                <Navigation className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-foreground">Delivery a domicilio</span>
                <span className="block text-xs text-muted-foreground">Te lo llevamos a tu casa</span>
              </span>
            </button>
            
            <button onClick={() => { setPickupInStore(true); setDeliveryFee(0); setDistanceKm(0); setError(""); }} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${pickupInStore ? "border-add bg-add/5" : "border-border bg-card"}`}>
              <span className={`flex size-10 items-center justify-center rounded-full ${pickupInStore ? "bg-add text-add-foreground" : "bg-secondary text-primary"}`}>
                <Store className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-foreground">Retirar en el local</span>
                <span className="block text-xs text-muted-foreground">Sin costo de envío</span>
              </span>
            </button>
          </div>
        </section>

        {!pickupInStore && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Dirección de entrega</h2>
            <div className="space-y-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
              <input value={address} onChange={(e) => { setAddress(e.target.value); setAddressModified(true); }} placeholder="Calle y número (ej: Gales 2233)" className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
              
              <div className="space-y-2">
                <button onClick={handleCalcularEnvio} disabled={isCalculating} className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 text-sm font-bold text-primary disabled:opacity-50 ${deliveryFee === 0 && !error ? "animate-pulse-warning" : ""}`}>
                  <LocateFixed className="size-4" />
                  {isCalculating ? "Calculando..." : "Calcular desde dirección"}
                </button>
              </div>
              
              {foundAddress && !error && <div className="flex items-start gap-2 rounded-2xl bg-add/10 p-3 text-xs"><MapPin className="size-4 shrink-0 text-add mt-0.5" /><span className="text-add"><strong>Encontramos:</strong> {foundAddress}</span></div>}
              {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
              {deliveryFee > 0 && !error && <div className="flex items-center justify-between rounded-2xl bg-add p-3"><span className="text-sm font-bold text-add-foreground">Envío ({distanceKm.toFixed(1)} km)</span><span className="text-base font-extrabold text-add-foreground">{formatPrice(deliveryFee)}</span></div>}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Tu teléfono</h2>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Tu WhatsApp (ej: 2804123456)" className="h-12 w-full rounded-2xl bg-card px-4 text-sm font-medium text-foreground shadow-sm outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Formas de pago</h2>
          <div className="space-y-2">
            <div className="rounded-2xl border border-add/30 bg-add/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-add text-add-foreground">💵</span>
                <div><p className="font-bold text-foreground">Efectivo</p><p className="text-xs text-muted-foreground">Pagás al recibir</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-add/30 bg-add/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-add text-add-foreground">🏦</span>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Transferencia</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 rounded-lg bg-background px-3 py-2 text-sm font-mono font-bold text-foreground">{config.alias_mercadopago}</code>
                    <button onClick={copiarAlias} className="flex size-10 items-center justify-center rounded-lg bg-add text-add-foreground">
                      {copiedAlias ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Titular: {config.nombre_titular_alias}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Instrucciones</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ej: tocar timbre, sin azúcar" className="w-full resize-none rounded-2xl bg-card p-4 text-sm font-medium text-foreground shadow-sm outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-card px-4 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total a pagar</span>
          <span className="text-lg font-extrabold tabular-nums text-foreground">{formatPrice(total)}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={isSending || (pickupInStore ? !phone : (!deliveryFee || !!error))}
          className="flex h-14 w-full items-center justify-center rounded-full bg-add text-base font-bold text-add-foreground transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Procesando..." : "Confirmar y Enviar por WhatsApp"}
        </button>
      </div>
    </div>
  )
}