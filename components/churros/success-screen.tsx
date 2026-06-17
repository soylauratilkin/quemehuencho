"use client"

import { Check } from "lucide-react"
import { useStore } from "./store"
import { formatPrice } from "@/lib/menu-data"

export function SuccessScreen() {
  const { setScreen, history, items, orderDetails } = useStore()
  
  // Obtener el último pedido
  const lastOrder = history[0]
  
  // Si no hay pedido en el historial, mostrar mensaje genérico
  if (!lastOrder) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#ff751f] text-black">
          <Check className="size-10" strokeWidth={3} />
        </div>
        <h1 className="mb-4 font-heading text-2xl font-bold text-white">Procesando pedido...</h1>
        
        <div className="mb-6 text-sm text-red-400 font-bold bg-red-900/20 p-4 rounded-xl border border-red-500/50 max-w-sm">
          ⚠️ Tu pedido <span className="underline">NO es efectivo</span> hasta que recibas un mensaje de confirmación por WhatsApp.
        </div>

        <button
          onClick={() => window.open(`https://wa.me/542804007296?text=${encodeURIComponent("Hola! Hice un pedido pero no recibí confirmación.")}`, "_blank", "noopener,noreferrer")}
          className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[#ff751f] text-base font-bold text-black shadow-xl"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-current">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.578-.985zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Contactar a Quemehuencho
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#ff751f] text-black animate-in zoom-in duration-300">
        <Check className="size-10" strokeWidth={3} />
      </div>
      <h1 className="mb-2 font-heading text-2xl font-bold text-white">Procesando pedido...</h1>
      
      <div className="mb-6 text-sm text-red-400 font-bold bg-red-900/20 p-4 rounded-xl border border-red-500/50 max-w-sm">
        ⚠️ Tu pedido <span className="underline">NO es efectivo</span> hasta que recibas un mensaje de confirmación por WhatsApp. Por favor, verificá que tu número sea correcto.
      </div>

      <div className="mb-6 w-full max-w-sm rounded-3xl bg-[#111] p-5 shadow-sm ring-1 ring-[#333] text-left">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Resumen del pedido</h3>
        
        {lastOrder.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm text-white mb-2">
            <span className="text-gray-300">{item.quantity}x {item.name}</span>
            <span className="font-bold">{formatPrice(item.quantity*item.price)}</span>
          </div>
        ))}
        
        <div className="my-3 border-t border-dashed border-[#333]" />
        
        {orderDetails && orderDetails.deliveryFee > 0 && (
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Envío</span>
            <span>{formatPrice(orderDetails.deliveryFee)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-extrabold text-[#ff751f] mt-2">
          <span>Total</span>
          <span>{formatPrice(lastOrder.total)}</span>
        </div>
      </div>

      <p className="mb-6 text-xs text-gray-500 max-w-xs">
        Si no recibís la confirmación, es posible que hayamos tenido un problema con tu número.
      </p>

      <button
        onClick={() => window.open(`https://wa.me/542804007296?text=${encodeURIComponent(`Hola! Hice un pedido (ID: ${lastOrder.id}) pero no recibí confirmación. Mi número es ${orderDetails?.phone || "no especificado"}.`)}`, "_blank", "noopener,noreferrer")}
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