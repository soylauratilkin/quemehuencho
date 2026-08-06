"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, LocateFixed, MapPin, Loader2, Check, Navigation, Store, Car } from "lucide-react"
import { formatPrice, calcularPrecioEnvio, fetchConfig, DEFAULT_CONFIG } from "@/lib/menu-data"
import { useStore } from "./store"

const WEBHOOK_URL = "/api/order";

export function CheckoutScreen() {
  const { subtotal, items, placeOrder, setScreen, orderDetails, setOrderDetails } = useStore()
  
  // ✅ CAMBIO 1: Usamos 'deliveryMode' en lugar de 'pickupInStore'
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'retiro' | 'doblefila'>(() => {
    if (orderDetails?.address?.includes("Doblefila")) return "doblefila"
    if (orderDetails?.address?.includes("Retiro")) return "retiro"
    return "delivery"
  })
  
  const [address, setAddress] = useState(() => localStorage.getItem("qh_address") || orderDetails?.address || "")
  const [phone, setPhone] = useState(() => localStorage.getItem("qh_phone") || orderDetails?.phone || "")
  const [notes, setNotes] = useState(orderDetails?.notes || "")
  const [geoLoading, setGeoLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [distanceKm, setDistanceKm] = useState(orderDetails?.distanceKm || 0)
  const [deliveryFee, setDeliveryFee] = useState(orderDetails?.deliveryFee || 0)
  const [error, setError] = useState("")
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [foundAddress, setFoundAddress] = useState("")
  const [addressModified, setAddressModified] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => { fetchConfig().then(setConfig) }, [])

  useEffect(() => {
    if (addressModified && deliveryFee > 0 && deliveryMode === 'delivery') {
      setDeliveryFee(0); setDistanceKm(0); setFoundAddress("");
      setError("⚠️ Modificaste la dirección. Volvé a calcular el envío.")
    }
  }, [address, deliveryMode])

  // ✅ CAMBIO 2: El costo de envío solo aplica si es 'delivery'
  const total = subtotal + (deliveryMode === 'delivery' ? deliveryFee : 0)

  const cleanPhone = phone.replace(/\D/g, "")
  const isPhoneValid = /^\d{10,11}$/.test(cleanPhone)

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
      alert("⚠️ El teléfono debe tener entre 10 y 11 dígitos numéricos (ej: 2804123456).")
      return
    }
    if (deliveryMode === 'delivery' && (!address || deliveryFee === 0)) {
      alert("Por favor, calculá el costo de envío primero.")
      return
    }

    setIsSending(true)
    localStorage.setItem("qh_phone", phone)
    if (deliveryMode === 'delivery') {
      localStorage.setItem("qh_address", address)
    }

    const orderId = `QMH-${Date.now()}`;

    // ✅ CAMBIO 3: Determinar dirección y tipo según el modo elegido
    let finalAddress = "Retiro en local"
    let orderType = "Retiro"
    let finalNotes = notes

    if (deliveryMode === 'delivery') {
      finalAddress = address
      orderType = "Delivery"
    } else if (deliveryMode === 'doblefila') {
      finalAddress = "Doblefila Express"
      orderType = "Doblefila Express"
      finalNotes = `${notes} (DOBLEFILA: Pago por transferencia pendiente de comprobante)`.trim()
    }

    const details = { 
      address: finalAddress, 
      phone, 
      distanceKm: deliveryMode === 'delivery' ? distanceKm : 0, 
      deliveryFee: deliveryMode === 'delivery' ? deliveryFee : 0, 
      paymentMethod: "A definir",
      notes: finalNotes 
    }
    
    setOrderDetails(details)

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
          type: orderType, // ✅ Se enviará "Doblefila Express", "Delivery" o "Retiro"
          distanceKm: details.distanceKm,
          deliveryFee: details.deliveryFee
        })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error enviando pedido:", error)
    } finally {
      setIsSending(false)
      placeOrder(details, orderId) 
    }
  }

  const limpiarTelefono = (valor: string) => {
    if (!valor) return ""
    let limpio = valor.replace(/\D/g, "")
    if (limpio.startsWith("549")) limpio = limpio.substring(3)
    else if (limpio.startsWith("54")) limpio = limpio.substring(2)
    if (limpio.length > 11) limpio = limpio.substring(0, 11)
    return limpio
  }

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización. Por favor, ingresa la dirección manualmente.")
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await response.json()
          const calle = data.address?.road || ""
          const numero = data.address?.house_number || ""
          const direccionFormateada = `${calle} ${numero}`.trim()
          
          setAddress(direccionFormateada || "Ubicación detectada (ajustar manualmente)")
          setAddressModified(true)
          localStorage.setItem("qh_address", direccionFormateada)
          
          setDeliveryFee(0); setDistanceKm(0); setFoundAddress(""); setError("")
        } catch (error) {
          console.error("Error obteniendo dirección:", error)
          alert("No se pudo obtener la dirección exacta. Por favor, ingrésala manualmente.")
        } finally {
          setGeoLoading(false)
        }
      },
      (error) => {
        setGeoLoading(false)
        if (error.code === 1) alert("Permiso de ubicación denegado. Por favor, ingrésala manualmente.")
        else alert("Error al obtener la ubicación. Inténtalo de nuevo.")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="flex min-h-dvh flex-col pb-44 bg-[#0a0a0a]">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#333] bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur">
        <button onClick={() => setScreen("cart")} className="flex size-10 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-heading text-xl font-semibold text-white">Finalizar pedido</h1>
      </header>

      <div className="space-y-6 px-4 pt-5">
        {/* MODO DE ENTREGA */}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Modo de entrega</h2>
          <div className="space-y-2">
            {/* 1. DELIVERY */}
            <button 
              onClick={() => setDeliveryMode('delivery')} 
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                deliveryMode === 'delivery' ? "border-[#ff751f] bg-[#ff751f] text-black" : "border-[#333] bg-[#111] text-gray-300"
              }`}
            >
              <Navigation className="size-5" strokeWidth={2.5} />
              <span className="flex-1">
                <span className="block font-bold">Delivery a domicilio</span>
                <span className="block text-xs opacity-80">Te lo llevamos a tu casa</span>
              </span>
            </button>
            
            {/* 2. RETIRO */}
            <button 
              onClick={() => { setDeliveryMode('retiro'); setDeliveryFee(0); setDistanceKm(0); setError(""); }} 
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                deliveryMode === 'retiro' ? "border-[#ff751f] bg-[#ff751f] text-black" : "border-[#333] bg-[#111] text-gray-300"
              }`}
            >
              <Store className="size-5" strokeWidth={2.5} />
              <span className="flex-1">
                <span className="block font-bold">Retirar en el local</span>
                <span className="block text-xs opacity-80">Pagás al retirar (efectivo/transferencia)</span>
              </span>
            </button>

            {/* 3. DOBLEFILA EXPRESS (NUEVO) */}
            <button 
              onClick={() => { setDeliveryMode('doblefila'); setDeliveryFee(0); setDistanceKm(0); setError(""); }} 
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                deliveryMode === 'doblefila' ? "border-green-500 bg-green-500/20 text-green-400" : "border-[#333] bg-[#111] text-gray-300"
              }`}
            >
              <Car className="size-5 text-green-400" strokeWidth={2.5} />
              <span className="flex-1">
                <span className="block font-bold">🟢 Doblefila Express</span>
                <span className="block text-xs opacity-80">Pagás por transferencia y te lo llevamos a la vereda</span>
              </span>
            </button>
          </div>
        </section>

        {/* ✅ CARTEL EXPLICATIVO DOBLEFILA */}
        {deliveryMode === 'doblefila' && (
          <div className="rounded-2xl border border-green-500/50 bg-green-900/20 p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🚗</span>
              <h3 className="font-extrabold text-green-400 text-sm uppercase tracking-wide">
                ¿Cómo funciona?
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-green-100/90">
              <li className="flex gap-2">
                <span className="font-bold text-green-400">1.</span>
                <span>
                  Realizá la transferencia al alias: <b className="text-white bg-green-700/50 px-1 rounded">{config.alias_mercadopago}</b>
                  <br />
                  <span className="text-[10px] opacity-80">Titular: {config.nombre_titular_alias}</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-400">2.</span>
                <span>Envianos el comprobante por WhatsApp para validar tu pago.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-400">3.</span>
                <span>Te avisamos cuando esté listo. Llegás a la puerta y <b className="text-white">te lo entregamos en la vereda</b>. ¡Sin estacionar!</span>
              </li>
            </ul>
          </div>
        )}

        {/* DIRECCIÓN (Solo si es Delivery) */}
        {deliveryMode === 'delivery' && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Dirección de entrega</h2>
            <div className="space-y-3 rounded-3xl bg-[#111] p-4 shadow-sm ring-1 ring-[#333]">
              <div className="flex gap-2">
                <input 
                  value={address} 
                  onChange={(e) => { setAddress(e.target.value); setAddressModified(true); }} 
                  placeholder="Calle y número (ej: Gales 2233)" 
                  className={`h-20 flex-1 rounded-2xl bg-[#1a1a1a] px-4 text-sm font-medium text-white outline-none ring-1 focus:ring-2 focus:ring-[#ff751f] transition-all ${
                    address.length === 0 && !deliveryFee ? "input-needs-attention ring-[#ff751f]" : "ring-[#333]"
                  }`} 
                />
                <button 
                  type="button"
                  onClick={obtenerUbicacionActual} 
                  disabled={geoLoading}
                  className={`h-20 w-20 shrink-0 rounded-2xl text-black font-bold flex flex-col items-center justify-center gap-1 transition-all py-2 ${
                    address.length === 0 && !deliveryFee ? "bg-[#ff751f] hover:bg-[#e66a1c] button-needs-attention" : "bg-[#ff751f] hover:bg-[#e66a1c] disabled:bg-gray-600"
                  }`}
                >
                  {geoLoading ? (
                    <><Loader2 className="size-5 animate-spin" /><span className="text-[10px] leading-tight text-center">Buscando...</span></>
                  ) : (
                    <><MapPin className="size-5" /><span className="text-[10px] leading-tight text-center font-bold">Usar mi<br/>ubicación</span></>
                  )}
                </button>
              </div>
              
              <button 
                onClick={handleCalcularEnvio} 
                disabled={isCalculating || address.length === 0}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition-all ${
                  address.length > 0 && !deliveryFee && !isCalculating
                    ? "border-[#ff751f] bg-[#ff751f]/20 text-[#ff751f] button-needs-attention"
                    : "border-[#ff751f]/30 bg-[#ff751f]/10 text-[#ff751f] disabled:opacity-50"
                }`}
              >
                <LocateFixed className="size-4" />{isCalculating ? "Calculando..." : "Calcular envío"}
              </button>
              
              {foundAddress && !error && <div className="flex items-start gap-2 rounded-2xl bg-[#ff751f]/10 p-3 text-xs"><MapPin className="size-4 shrink-0 text-[#ff751f] mt-0.5" /><span className="text-[#ff751f]"><strong>Encontramos:</strong> {foundAddress}</span></div>}
              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
              
              {deliveryFee > 0 && !error && (
                <div className="flex items-center justify-between rounded-2xl bg-[#ff751f] p-4 text-black shadow-lg">
                  <span className="text-sm font-bold">Envío ({distanceKm.toFixed(1)} km)</span>
                  <span className="text-base font-extrabold">{formatPrice(deliveryFee)}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TELÉFONO */}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Tu teléfono (Obligatorio)</h2>
          <div className="relative">
            <input 
              value={phone} 
              onChange={(e) => setPhone(limpiarTelefono(e.target.value))}
              inputMode="numeric"
              placeholder="Ej: 2804123456 (10 dígitos)" 
              className={`h-12 w-full rounded-2xl px-4 text-sm font-medium outline-none ring-1 focus:ring-2 transition-all ${
                !isPhoneValid ? "bg-red-900/20 text-red-400 ring-red-500" 
                : (deliveryMode === 'delivery' && deliveryFee > 0 && !isPhoneValid) ? "bg-[#111] text-white input-needs-attention ring-[#ff751f] focus:ring-[#ff751f]"
                : "bg-[#111] text-white ring-[#333] focus:ring-[#ff751f]"
              }`} 
            />
            {isPhoneValid && <Check className="absolute right-4 top-3.5 size-5 text-green-500" />}
          </div>
          {!isPhoneValid && (
            <p className={`mt-2 text-xs font-medium flex items-center gap-1 ${deliveryMode === 'delivery' && deliveryFee > 0 ? "text-[#ff751f]" : "text-red-400"}`}>
              <span>⚠️</span>
              {phone.length === 0 ? "Ingresa tu teléfono para habilitar el botón de confirmar" : `Faltan ${10 - phone.length} dígito${10 - phone.length === 1 ? "" : "s"} (mínimo 10)`}
            </p>
          )}
          {isPhoneValid && (
            <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
              <span>✅</span> Teléfono válido
            </p>
          )}
        </section>

        {/* NOTAS */}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Instrucciones</h2>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            rows={2} 
            placeholder={deliveryMode === 'doblefila' ? "Ej: Soy el auto rojo" : "Ej: tocar timbre, sin azúcar"} 
            className="w-full resize-none rounded-2xl bg-[#111] p-4 text-sm font-medium text-white shadow-sm outline-none ring-1 ring-[#333] focus:ring-2 focus:ring-[#ff751f]" 
          />
        </section>
      </div>

      {/* BOTÓN DE CONFIRMACIÓN */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t-2 border-[#ff751f] bg-[#ff751f] px-4 py-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-black/80 font-semibold">Total a pagar</span>
          <span className="text-lg font-extrabold tabular-nums text-black">{formatPrice(total)}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={isSending || !isPhoneValid || (deliveryMode === 'delivery' && (!deliveryFee || !!error))}
          className={`flex h-14 w-full items-center justify-center rounded-full bg-black text-base font-bold text-[#ff751f] transition-transform active:scale-[0.98] ${
            !isSending && isPhoneValid && (deliveryMode !== 'delivery' || (deliveryFee && !error))
              ? "btn-ready hover:scale-[1.02]" 
              : "disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {isSending ? "Procesando..." : "Confirmar Pedido"}
        </button>
      </div>
    </div>
  )
}