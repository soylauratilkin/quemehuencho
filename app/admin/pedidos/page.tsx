"use client"

import { useEffect, useState, useCallback } from "react"
import { Check, CreditCard, RefreshCw } from "lucide-react"
import { formatPrice } from "@/lib/menu-data"

type Pedido = {
  id: string
  fecha: string
  ubicacion: string
  total: number
  detalle: string
  entregado: boolean
  pagado: boolean
  origen: string
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todos" | "mostrador" | "mesas" | "baul">("todos")

  const cargarPedidos = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/pedidos")
      const data = await res.json()
      setPedidos(data.pedidos || [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPedidos()
    const interval = setInterval(cargarPedidos, 15000)
    return () => clearInterval(interval)
  }, [cargarPedidos])

  async function marcarEntregado(id: string) {
    await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "entregado", id })
    })
    cargarPedidos()
  }

  async function marcarPagado(id: string) {
    await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pagado", id })
    })
    cargarPedidos()
  }

  const pedidosAbiertos = pedidos.filter((p) => !p.pagado)
  
  const pedidosFiltrados = pedidosAbiertos.filter((p) => {
    if (filtro === "todos") return true
    if (filtro === "mostrador") return p.ubicacion === "Mostrador"
    if (filtro === "baul") return p.ubicacion === "Baúl"
    if (filtro === "mesas") return p.ubicacion.startsWith("Mesa")
    return true
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pedidos Activos</h1>
          <p className="mt-1 text-sm text-gray-400">
            {pedidosFiltrados.length} pedido(s) abierto(s)
          </p>
        </div>
        <button
          onClick={cargarPedidos}
          className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-white hover:bg-[#2a2a2a]"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* FILTROS */}
      <div className="mb-6 flex gap-2">
        {[
          { id: "todos", label: "Todos" },
          { id: "mostrador", label: "Mostrador" },
          { id: "mesas", label: "Mesas" },
          { id: "baul", label: "Baúl" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id as any)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
              filtro === f.id ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] text-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LISTA DE PEDIDOS */}
      {isLoading && pedidos.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff751f] border-t-transparent" />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="rounded-3xl bg-[#111] p-12 text-center ring-1 ring-[#333]">
          <p className="text-lg font-bold text-gray-400">No hay pedidos activos</p>
          <p className="mt-1 text-sm text-gray-500">Los nuevos pedidos aparecerán acá</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              className={`rounded-3xl p-5 shadow-lg ring-1 ${
                pedido.entregado && pedido.pagado
                  ? "bg-green-900/20 ring-green-500/50"
                  : pedido.entregado
                  ? "bg-blue-900/20 ring-blue-500/50"
                  : "bg-[#111] ring-[#333]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#ff751f] px-3 py-1 text-xs font-bold text-black">
                      {pedido.ubicacion}
                    </span>
                    <span className="text-xs text-gray-500">{pedido.origen}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{pedido.fecha}</p>
                  <p className="text-xs text-gray-500 font-mono">{pedido.id}</p>
                </div>
                <p className="text-2xl font-extrabold text-[#ff751f]">{formatPrice(pedido.total)}</p>
              </div>

              <div className="mb-4 rounded-xl bg-[#0a0a0a] p-3">
                <p className="text-sm text-white">{pedido.detalle}</p>
              </div>

              <div className="mb-3 flex gap-2">
                <span className={`flex-1 rounded-full px-3 py-1 text-center text-xs font-bold ${
                  pedido.entregado ? "bg-blue-500 text-white" : "bg-[#1a1a1a] text-gray-500"
                }`}>
                  {pedido.entregado ? "✓ Entregado" : "Pendiente"}
                </span>
                <span className={`flex-1 rounded-full px-3 py-1 text-center text-xs font-bold ${
                  pedido.pagado ? "bg-green-500 text-white" : "bg-[#1a1a1a] text-gray-500"
                }`}>
                  {pedido.pagado ? "✓ Pagado" : "Sin pagar"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => marcarEntregado(pedido.id)}
                  disabled={pedido.entregado}
                  className="flex flex-1 items-center justify-center gap-1 rounded-full bg-blue-500 px-3 py-2 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-30"
                >
                  <Check className="size-4" />
                  Entregado
                </button>
                <button
                  onClick={() => marcarPagado(pedido.id)}
                  disabled={pedido.pagado}
                  className="flex flex-1 items-center justify-center gap-1 rounded-full bg-green-500 px-3 py-2 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-30"
                >
                  <CreditCard className="size-4" />
                  Pagado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}