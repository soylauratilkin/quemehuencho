// Primero, agregá esto al inicio de checkout-screen.tsx
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const DIRECCION_LOCAL = "Roque Sáenz Peña 212, Puerto Madryn, Argentina";

async function calcularDistanciaReal(direccionDestino: string): Promise<number | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("No hay API Key de Google Maps. Usando estimación.");
    return 3.5; // Fallback
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${encodeURIComponent(DIRECCION_LOCAL)}&` +
      `destinations=${encodeURIComponent(direccionDestino + ", Puerto Madryn, Argentina")}&` +
      `mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.rows[0].elements[0].status === "OK") {
      const distanciaMetros = data.rows[0].elements[0].distance.value;
      return distanciaMetros / 1000; // Convertir a km
    } else {
      console.error("Error en Distance Matrix:", data.rows[0].elements[0].status);
      return null;
    }
  } catch (error) {
    console.error("Error calculando distancia:", error);
    return null;
  }
}


"use client"

import { useState } from "react"
import { ArrowLeft, Banknote, CreditCard, Link2, LocateFixed, MapPin, Store } from "lucide-react"
import { formatPrice, calcularPrecioEnvio } from "@/lib/menu-data"
import { useStore } from "./store"
import { cn } from "@/lib/utils"

const payments = [
  { id: "Efectivo", label: "Efectivo", note: "Pagás al recibir", icon: Banknote },
  { id: "Mercado Pago", label: "Mercado Pago", note: "Te enviamos el link", icon: Link2 },
  { id: "Transferencia", label: "Transferencia", note: "Compartinos el comprobante", icon: CreditCard },
]

export function CheckoutScreen() {
  const { subtotal, items, placeOrder, setScreen, orderDetails, setOrderDetails } = useStore()
  const [address, setAddress] = useState(orderDetails?.address || "")
  const [phone, setPhone] = useState(orderDetails?.phone || "")
  const [payment, setPayment] = useState(orderDetails?.paymentMethod || "Transferencia")
  const [notes, setNotes] = useState(orderDetails?.notes || "")
  const [isCalculating, setIsCalculating] = useState(false)
  const [distanceKm, setDistanceKm] = useState(orderDetails?.distanceKm || 0)
  const [deliveryFee, setDeliveryFee] = useState(orderDetails?.deliveryFee || 0)
  const [error, setError] = useState("")

  const total = subtotal + deliveryFee

async function useMyLocation() {
  setIsCalculating(true);
  setError("");

  if (!address.trim()) {
    setError("Primero escribí tu dirección arriba.");
    setIsCalculating(false);
    return;
  }

  try {
    const distancia = await calcularDistanciaReal(address);
    
    if (distancia === null) {
      setError("No pudimos calcular la distancia. Verificá la dirección.");
      setIsCalculating(false);
      return;
    }

    setDistanceKm(distancia);
    
    const fee = calcularPrecioEnvio(distancia);
    if (fee) {
      setDeliveryFee(fee);
    } else {
      setError("Lo sentimos, estás fuera de nuestra zona de delivery (máx 10 km).");
    }
  } catch (err) {
    setError("Error al calcular la distancia. Intentá de nuevo.");
  }
  
  setIsCalculating(false);
}

  function handlePlaceOrder() {
    if (!address || !phone) {
      alert("Por favor, completá tu dirección y teléfono.")
      return
    }
    if (deliveryFee === 0 && !error) {
      alert("Por favor, calculá el costo de envío primero.")
      return
    }

    const details = { address, phone, distanceKm, deliveryFee, paymentMethod: payment, notes }
    setOrderDetails(details)
    placeOrder(details)
  }

  function handleWhatsApp() {
    if (!orderDetails) return
    
    const itemsList = items.map((i) => `• ${i.quantity}x ${i.name}`).join("\n")
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderDetails.address + ", Puerto Madryn")}`
    const now = new Date().toLocaleString("es-AR")
    const orderId = `QMH-${Math.floor(Math.random() * 9000) + 1000}`

    const mensaje = `🚀 *VIAJE CONFIRMADO* 🚀

📦 *DETALLES DEL ENVÍO*
━━━━━━━━━━━━━━━━
🏪 *PUNTO DE RETIRO*
📍 Roque Sáenz Peña 212
📱 5492804007296

🏠 *PUNTO DE ENTREGA*
📍 ${orderDetails.address}
📱 ${orderDetails.phone}
👌 *DETALLES*
📏 Distancia: ${orderDetails.distanceKm.toFixed(1)} km

📦 *Pedido:*
${itemsList}
Subtotal: ${formatPrice(subtotal)}

🏍️ Envío: *${formatPrice(orderDetails.deliveryFee)}*
💰 *Total: ${formatPrice(total)}*
💳 Método: ${orderDetails.paymentMethod}
📝 Notas: ${orderDetails.notes || "Ninguna"}

🗺️ *MAPA*
${mapLink}

🆔 ID: ${orderId}
🕒 ${now}`

    // Reemplaza este número con el de la empresa de delivery o el tuyo
    const numeroDelivery = "5492804007296" 
    const url = `https://wa.me/${numeroDelivery}?text=${encodeURIComponent(mensaje)}`
    window.open(url, "_blank", "noopener,noreferrer")
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
              {isCalculating ? "Calculando..." : "Usar mi ubicación"}
            </button>
            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
            {deliveryFee > 0 && !error && (
              <p className="text-sm font-bold text-add">✅ Costo de envío calculado: {formatPrice(deliveryFee)}</p>
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

        <button
          onClick={handleWhatsApp}
          disabled={!orderDetails}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-add/40 bg-add/5 py-3 text-sm font-bold text-add disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.578-.985zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Enviar pedido por WhatsApp
        </button>
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