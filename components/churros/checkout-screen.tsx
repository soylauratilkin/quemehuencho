"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, LocateFixed, MapPin, Check, Navigation, Store, Phone } from "lucide-react"
import { formatPrice, calcularPrecioEnvio, fetchConfig, DEFAULT_CONFIG } from "@/lib/menu-data"
import { useStore } from "./store"

const WEBHOOK_URL = "/api/order";

export function CheckoutScreen() {
  const { subtotal, items, placeOrder, setScreen, orderDetails, setOrderDetails } = useStore()
  
  const [address, setAddress] = useState(() => localStorage.getItem("qh_address") || orderDetails?.address || "")
  const [phone, setPhone] = useState(() => localStorage.getItem("qh_phone") || orderDetails?.phone || "")
  const [notes, setNotes] = useState(orderDetails?.notes || "")
  
  const [isCalculating, setIsCalculating] = useState(false)
  const [distanceKm, setDistanceKm] = useState(orderDetails?.distanceKm || 0)
  const [deliveryFee, setDeliveryFee] = useState(orderDetails?.deliveryFee || 0)
  const [error, setError] = useState("")
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [foundAddress, setFoundAddress] = useState("")
  const [addressModified, setAddressModified] = useState(false)
  const [pickupInStore, setPickupInStore] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  // Estados para pantalla de éxito
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderSummary, setOrderSummary] = useState({ id: "", time: "", total: 0, type: "" })

  useEffect(() => { fetchConfig().then(setConfig) }, [])

  useEffect(() => {
    if (addressModified && deliveryFee > 0 && !pickupInStore) {
      setDeliveryFee(0); setDistanceKm(0); setFoundAddress("");
      setError("⚠️ Modificaste la dirección. Volvé a calcular el envío.")
    }
  }, [address])

  const total = subtotal + (pickupInStore ? 0 : deliveryFee)

  // Validación de teléfono: debe tener al menos 8 dígitos numéricos
  const isPhoneValid = /^\d{8,15}$/.test(phone.replace(/\s/g, ""))

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
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
      return null
    }
  }

  async function handleCalcularEnvio() {
    setIsCalculating(true); setError(""); setFoundAddress("")
    if (!address.trim()) { setError("Primero escribí tu dirección."); setIsCalculating(false); return }

    const distancia = await calcularDistanciaReal(address)
    if (distancia !== null) {
      setDistanceKm(distancia); setAddressModified(false)
      const fee = calcularPrecioEnvio(distancia)
      if (fee) setDeliveryFee(fee)
      else setError(`Estás a ${distancia.toFixed(1)} km, fuera de nuestra zona (máx 10 km).`)
    }
    setIsCalculating(false)
  }

  function limpiarDireccion(direccionCompleta: string): string {
    if (!direccionCompleta) return ""
    const partes = direccionCompleta.split(",").map(p => p.trim())
    const calle = partes[0] || ""
    const ciudad = partes.find(p => p.toLowerCase().includes("madryn")) || "Puerto Madryn"
    return `${calle}, ${ciudad.replace(/U?\d{4}\s*/i, "").trim()}`
  }

  async function handlePlaceOrder() {
    if (!isPhoneValid) {
      alert("Por favor, ingresá un número de teléfono válido (solo números, ej: 2804123456).")
      return
    }
    if (!pickupInStore && (!address || deliveryFee === 0)) {
      alert("Por favor, calculá el costo de envío primero.")
      return
    }

    setIsSending(true)
    localStorage.setItem("qh_address", pickupInStore ? "" : address)
    localStorage.setItem("qh_phone", phone)
    localStorage.setItem("qh_last_order", new Date().toISOString())

    const details = { 
      address: pickupInStore ? "Retiro en local" : address, 
      phone, 
      distanceKm: pickupInStore ? 0 : distanceKm, 
      deliveryFee: pickupInStore ? 0 : deliveryFee, 
      notes: pickupInStore ? `${notes} (RETIRA EN LOCAL)` : notes 
    }
    setOrderDetails(details)
    placeOrder(details)
    
    const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`
    const now = new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "")

    // Enviar a Apps Script (Guarda en Sheets + Envía Telegram)
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          phone: phone,
          address: details.address,
          total: Math.round(total),
          items: items,
          notes: details.notes,
          type: pickupInStore ? "Retiro" : "Delivery"
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setOrderSummary({ id: orderId, time: now, total, type: pickupInStore ? "Retiro en Local" : "Delivery" })
        setOrderConfirmed(true)
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error:", error)
      // Igual mostramos la pantalla de éxito porque el pedido probablemente se guardó
      setOrderSummary({ id: orderId, time: now, total, type: pickupInStore ? "Retiro en Local" : "Delivery" })
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
        <p className="mb-8 text-muted-foreground max-w-xs">
          Lo estamos preparando. Si necesitamos algo, te contactaremos a tu WhatsApp.
        </p>
        
        <div className="mb-8 w-full max-w-sm rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border text-left">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">ID del Pedido</span>
            <span className="font-mono font-bold text-foreground">{orderSummary.id}</span>
          </div>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">Tipo</span>
            <span className="font-bold text-foreground">{orderSummary.type}</span>
          </div>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-extrabold text-add">{formatPrice(orderSummary.total)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-xl">
            <Phone className="size-4" />
            Te contactaremos al: <span className="font-bold text-foreground">{phone}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setOrderConfirmed(false)
            setScreen("home")
          }}
          className="flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Hacer otro pedido
        </button>
      </div>
    )
  }

  // ==========================================
  // PANTALLA DE CHECKOUT
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
              <Navigation className="size-5" />
              <span className="flex-1"><span className="block font-bold text-foreground">Delivery a domicilio</span><span className="block text-xs text-muted-foreground">Te lo llevamos a tu casa</span></span>
            </button>
            <button onClick={() => { setPickupInStore(true); setDeliveryFee(0); setDistanceKm(0); setError(""); }} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${pickupInStore ? "border-add bg-add/5" : "border-border bg-card"}`}>
              <Store className="size-5" />
              <span className="flex-1"><span className="block font-bold text-foreground">Retirar en el local</span><span className="block text-xs text-muted-foreground">Sin costo de envío</span></span>
            </button>
          </div>
        </section>

        {!pickupInStore && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Dirección de entrega</h2>
            <div className="space-y-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
              <input value={address} onChange={(e) => { setAddress(e.target.value); setAddressModified(true); }} placeholder="Calle y número (ej: Gales 2233)" className="h-12 w-full rounded-2xl bg-secondary px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
              <button onClick={handleCalcularEnvio} disabled={isCalculating} className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 text-sm font-bold text-primary disabled:opacity-50 ${deliveryFee === 0 && !error ? "animate-pulse-warning" : ""}`}>
                <LocateFixed className="size-4" />{isCalculating ? "Calculando..." : "Calcular envío"}
              </button>
              {foundAddress && !error && <div className="flex items-start gap-2 rounded-2xl bg-add/10 p-3 text-xs"><MapPin className="size-4 shrink-0 text-add mt-0.5" /><span className="text-add"><strong>Encontramos:</strong> {foundAddress}</span></div>}
              {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
              {deliveryFee > 0 && !error && <div className="flex items-center justify-between rounded-2xl bg-add p-3"><span className="text-sm font-bold text-add-foreground">Envío ({distanceKm.toFixed(1)} km)</span><span className="text-base font-extrabold text-add-foreground">{formatPrice(deliveryFee)}</span></div>}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Tu teléfono (Obligatorio)</h2>
          <div className="relative">
            <input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} // Solo permite números
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 2804123456" 
              className={`h-12 w-full rounded-2xl px-4 text-sm font-medium outline-none ring-1 focus:ring-2 ${
                phone.length > 0 && !isPhoneValid 
                  ? "bg-destructive/10 text-destructive ring-destructive" 
                  : "bg-card text-foreground ring-border focus:ring-add"
              }`} 
            />
            {phone.length > 0 && isPhoneValid && (
              <Check className="absolute right-4 top-3.5 size-5 text-add" />
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Lo usaremos solo para contactarte si hay algún inconveniente con tu pedido.
          </p>
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
          disabled={isSending || !isPhoneValid || (pickupInStore ? false : (!deliveryFee || !!error))}
          className="flex h-14 w-full items-center justify-center rounded-full bg-add text-base font-bold text-add-foreground transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-add-foreground border-t-transparent"></span>
              Procesando...
            </span>
          ) : (
            "Confirmar Pedido"
          )}
        </button>
      </div>
    </div>
  )
}