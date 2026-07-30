"use client"

import { X, Check, Edit3 } from "lucide-react"
import { formatPrice } from "@/lib/menu-data"

type PedidoItem = {
  name: string
  quantity: number
  price: number
}

interface ConfirmacionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  items: PedidoItem[]
  total: number
  ubicacion: string
  telefono?: string
  direccion?: string
}

export default function ConfirmacionModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  total,
  ubicacion,
}: ConfirmacionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#111] p-6 ring-1 ring-[#333] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* ENCABEZADO */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">📋 Confirmar Pedido</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition">
            <X className="size-5" />
          </button>
        </div>

        {/* UBICACIÓN */}
        <div className="mb-4 space-y-2 rounded-xl bg-[#0a0a0a] p-3 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>📍 Ubicación:</span>
            <span className="font-bold text-[#ff751f]">{ubicacion}</span>
          </div>
        </div>

        {/* LISTA DE ITEMS (Aquí es donde se muestran los nombres y cantidades) */}
        <div className="mb-4 max-h-60 overflow-y-auto space-y-2 rounded-xl bg-[#0a0a0a] p-3">
          {items.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No hay items</p>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm text-white border-b border-[#222] pb-2 last:border-0">
                <span>
                  <span className="font-bold text-[#ff751f]">{item.quantity}x</span> {item.name}
                </span>
                <span className="text-gray-400">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        {/* TOTAL */}
        <div className="mb-6 flex justify-between items-center border-t border-[#333] pt-3">
          <span className="text-lg font-bold text-white">Total a pagar:</span>
          <span className="text-xl font-extrabold text-[#ff751f]">{formatPrice(total)}</span>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#1a1a1a] py-3 text-sm font-bold text-gray-300 hover:bg-[#2a2a2a] transition"
          >
            <Edit3 className="size-4" /> Editar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#ff751f] py-3 text-sm font-bold text-black hover:bg-[#ff8a3d] transition"
          >
            <Check className="size-4" /> Confirmar Pedido
          </button>
        </div>

      </div>
    </div>
  )
}