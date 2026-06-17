"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, LocateFixed, MapPin, Check, Navigation, Store, Phone } from "lucide-react"
import { formatPrice, calcularPrecioEnvio, fetchConfig, DEFAULT_CONFIG, type CartItem } from "@/lib/menu-data"
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
  
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderSummary, setOrderSummary] = useState({ id: "", time: "", total: 0, type: "", items: [] as CartItem[] })

  useEffect(() => { fetchConfig().then(setConfig) }, [])

  useEffect(() => {
    if (addressModified && deliveryFee > 0 && !pickupInStore) {
      setDeliveryFee(0); setDistanceKm(0); setFoundAddress("");
      setError("️ Modificaste la dirección. Volvé a calcular el envío.")
    }
  }, [address])

  const total = subtotal + (pickupInStore ? 0 : deliveryFee)

  // VALIDACIÓN ESTRICTA DE TELÉFONO (Mínimo 10 dígitos, máximo 15, solo números)
  const isPhoneValid = /^\d{10,15}$/.test(phone.replace(/\s/g, ""))

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

  async function handlePlaceOrder() {
    if (!isPhoneValid) {
      alert("⚠️ El teléfono debe tener entre 10 y 15 dígitos numéricos (ej: 2804123456). Sin espacios ni códigos de país.")
      return
    }
    if (!pickupInStore && (!address || deliveryFee === 0)) {
      alert("Por favor, calculá el costo de envío primero.")
      return
    }

    setIsSending(true)
    localStorage.setItem("qh_address", pickupInStore ? "" : address)
    localStorage.setItem("qh_phone", phone)

    const details = { 
      address: pickupInStore ? "Retiro en local" : address, 
      phone, 
      distanceKm: pickupInStore ? 0 : distanceKm, 
      deliveryFee: pickupInStore ? 0 : deliveryFee, 
      notes: pickupInStore ? `${notes} (RETIRA EN LOCAL)` : notes 
    }
    setOrderDetails(details)
    
    const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`
    const now = new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "")

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
          type: pickupInStore ? "Retiro" : "Delivery",
          distanceKm: pickupInStore ? 0 : distanceKm,
          deliveryFee: pickupInStore ? 0 : deliveryFee
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Guardamos los items ANTES de que placeOrder los borre del store
        setOrderSummary({ id: orderId, time: now, total, type: pickupInStore ? "Retiro en Local" : "Delivery", items: [...items] })
        placeOrder(details)
        setOrderConfirmed(true)
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error:", error)
      setOrderSummary({ id: orderId, time: now, total, type: pickupInStore ? "Retiro en Local" : "Delivery", items: [...items] })
      placeOrder(details)
      setOrderConfirmed(true)
    } finally {
      setIsSending(false)
    }
  }

  // ==========================================
  // PANTALLA DE ÉXITO (NUEVA VERSIÓN)
  // ==========================================
  if (orderConfirmed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#ff751f] text-black animate-in zoom-in duration-300">
          <Check className="size-10" strokeWidth={3} />
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold text-white">Procesando pedido...</h1>
        
        <div className="mb-6 text-sm text-red-400 font-bold bg-red-900/20 p-4 rounded-xl border border-red-500/50 max-w-sm">
          ️ Tu pedido <span className="underline">NO es efectivo</span> hasta que recibas un mensaje de confirmación por WhatsApp. Por favor, verificá que tu número sea correcto.
        </div>

        <div className="mb-6 w-full max-w-sm rounded-3xl bg-[#111] p-5 shadow-sm ring-1 ring-[#333] text-left">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Resumen del pedido</h3>
          {orderSummary.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm text-white mb-2">
              <span className="text-gray-300">{item.quantity}x {item.name}</span>
              <span className="font-bold">{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div className="my-3 border-t border-dashed border-[#333]" />
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Envío</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-lg font-extrabold text-[#ff751f] mt-2">
            <span>Total</span>
            <span>{formatPrice(orderSummary.total)}</span>
          </div>
        </div>

        <p className="mb-6 text-xs text-gray-500 max-w-xs">
          Si no recibís la confirmación, es posible que hayamos tenido un problema con tu número.
        </p>

        <button
          onClick={() => window.open(`https://wa.me/542804007296?text=${encodeURIComponent(`Hola! Hice un pedido (ID: ${orderSummary.id}) pero no recibí confirmación. Mi número es ${phone}.`)}`, "_blank", "noopener,noreferrer")}
          className="mb-4 flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[#ff751f] text-base font-bold text-black transition-transform active:scale-[0.98] shadow-xl"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-current">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.578-.985zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Contactar a Quemehuencho
        </button>
      </div>
    )
  }

  // ==========================================
  // PANTALLA DE CHECKOUT NORMAL
  // ==========================================
  return (
    <div className="flex min-h-dvh flex-col pb-44 bg-[#0a0a0a]">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#333] bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur">
        <button onClick={() => setScreen("cart")} className="flex size-10 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-heading text-xl font-semibold text-white">Finalizar pedido</h1>
      </header>

      <div className="space-y-6 px-4 pt-5">
        {/* MODO DE ENTREGA (Resaltado en naranja) */}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Modo de entrega</h2>
          <div className="space-y-2">
            <button onClick={() => setPickupInStore(false)} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all ${!pickupInStore ? "border-[#ff751f] bg-[#ff751f] text-black" : "border-[#333] bg-[#111] text-gray-300"}`}>
              <Navigation className="size-5" strokeWidth={2.5} />
              <span className="flex-1">
                <span className="block font-bold">Delivery a domicilio</span>
                <span className="block text-xs opacity-80">Te lo llevamos a tu casa</span>
              </span>
            </button>
            
            <button onClick={() => { setPickupInStore(true); setDeliveryFee(0); setDistanceKm(0); setError(""); }} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all ${pickupInStore ? "border-[#ff751f] bg-[#ff751f] text-black" : "border-[#333] bg-[#111] text-gray-300"}`}>
              <Store className="size-5" strokeWidth={2.5} />
              <span className="flex-1">
                <span className="block font-bold">Retirar en el local</span>
                <span className="block text-xs opacity-80">Sin costo de envío</span>
              </span>
            </button>
          </div>
        </section>

        {!pickupInStore && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Dirección de entrega</h2>
            <div className="space-y-3 rounded-3xl bg-[#111] p-4 shadow-sm ring-1 ring-[#333]">
              <input value={address} onChange={(e) => { setAddress(e.target.value); setAddressModified(true); }} placeholder="Calle y número (ej: Gales 2233)" className="h-12 w-full rounded-2xl bg-[#1a1a1a] px-4 text-sm font-medium text-white outline-none ring-1 ring-[#333] focus:ring-2 focus:ring-[#ff751f]" />
              
              <button onClick={handleCalcularEnvio} disabled={isCalculating} className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#ff751f]/30 bg-[#ff751f]/10 text-sm font-bold text-[#ff751f] disabled:opacity-50`}>
                <LocateFixed className="size-4" />{isCalculating ? "Calculando..." : "Calcular envío"}
              </button>
              
              {foundAddress && !error && <div className="flex items-start gap-2 rounded-2xl bg-[#ff751f]/10 p-3 text-xs"><MapPin className="size-4 shrink-0 text-[#ff751f] mt-0.5" /><span className="text-[#ff751f]"><strong>Encontramos:</strong> {foundAddress}</span></div>}
              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
              
              {/* REnglón de envío resaltado en naranja */}
              {deliveryFee > 0 && !error && (
                <div className="flex items-center justify-between rounded-2xl bg-[#ff751f] p-4 text-black shadow-lg">
                  <span className="text-sm font-bold">Envío ({distanceKm.toFixed(1)} km)</span>
                  <span className="text-base font-extrabold">{formatPrice(deliveryFee)}</span>
                </div>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Tu teléfono (Obligatorio)</h2>
          <div className="relative">
            <input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Ej: 2804123456 (10 dígitos)" 
              className={`h-12 w-full rounded-2xl px-4 text-sm font-medium outline-none ring-1 focus:ring-2 ${
                phone.length > 0 && !isPhoneValid 
                  ? "bg-red-900/20 text-red-400 ring-red-500" 
                  : "bg-[#111] text-white ring-[#333] focus:ring-[#ff751f]"
              }`} 
            />
            {phone.length > 0 && isPhoneValid && (
              <Check className="absolute right-4 top-3.5 size-5 text-[#ff751f]" />
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Ingresá solo números (mínimo 10 dígitos). Es vital para contactarte.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Instrucciones</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ej: tocar timbre, sin azúcar" className="w-full resize-none rounded-2xl bg-[#111] p-4 text-sm font-medium text-white shadow-sm outline-none ring-1 ring-[#333] focus:ring-2 focus:ring-[#ff751f]" />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t-2 border-[#ff751f] bg-[#ff751f] px-4 py-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-black/80 font-semibold">Total a pagar</span>
          <span className="text-lg font-extrabold tabular-nums text-black">{formatPrice(total)}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={isSending || !isPhoneValid || (pickupInStore ? false : (!deliveryFee || !!error))}
          className="flex h-14 w-full items-center justify-center rounded-full bg-black text-base font-bold text-[#ff751f] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Procesando..." : "Confirmar Pedido"}
        </button>
      </div>
    </div>
  )
}