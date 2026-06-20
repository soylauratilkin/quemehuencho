"use client"

import { useEffect, useState, useCallback } from "react"
import { HandCoins, Banknote, Edit3, Plus, Trash2, X, Check } from "lucide-react"
import { formatPrice } from "@/lib/menu-data"

type PedidoItem = {
  productId?: string
  name: string
  price: number
  quantity: number
}

type Pedido = {
  id: string
  fecha: string
  ubicacion: string
  total: number
  detalle: string
  entregado: boolean
  pagado: boolean
  origen: string
  items?: PedidoItem[]
  rowNumber?: number
}

type Filtro = "todos" | "mostrador" | "mesas" | "envios"

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [itemsEdit, setItemsEdit] = useState<PedidoItem[]>([])

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

  async function toggleEstado(id: string, tipo: "entregado" | "pagado") {
    await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: tipo, id })
    })
    cargarPedidos()
  }

  // Clasificar pedido
  function clasificar(p: Pedido): "mostrador" | "mesas" | "envios" {
    if (p.origen === "web" || p.ubicacion?.toLowerCase().includes("delivery") || p.ubicacion?.toLowerCase().includes("envio")) {
      return "envios"
    }
    if (p.ubicacion === "Mostrador") return "mostrador"
    return "mesas" // Mesa 1-5 o Baúl
  }

  // Filtrar pedidos abiertos (no pagados)
  const pedidosAbiertos = pedidos.filter((p) => !p.pagado)

  const pedidosFiltrados = pedidosAbiertos.filter((p) => {
    if (filtro === "todos") return true
    return clasificar(p) === filtro
  })

  // ACUMULADO DE VENTAS DEL DÍA (todos los pedidos, incluso pagados)
  const ventasHoy = pedidos.filter((p) => {
    const fecha = new Date(p.fecha)
    const hoy = new Date()
    return fecha.toDateString() === hoy.toDateString()
  })

  const acumulado = {
    mostrador: ventasHoy.filter(p => clasificar(p) === "mostrador").reduce((acc, p) => acc + p.total, 0),
    mesas: ventasHoy.filter(p => clasificar(p) === "mesas").reduce((acc, p) => acc + p.total, 0),
    envios: ventasHoy.filter(p => clasificar(p) === "envios").reduce((acc, p) => acc + p.total, 0),
    total: ventasHoy.reduce((acc, p) => acc + p.total, 0),
  }

  // EDITAR ITEMS
  function empezarEditar(pedido: Pedido) {
    // Parsear detalle si no hay items
    let items: PedidoItem[] = pedido.items || []
    if (items.length === 0 && pedido.detalle) {
      items = pedido.detalle.split(" | ").map((d) => {
        const match = d.match(/^(\d+)x\s+(.+)$/)
        if (match) {
          return { name: match[2], quantity: parseInt(match[1]), price: 0 }
        }
        return { name: d, quantity: 1, price: 0 }
      })
    }
    setItemsEdit(items)
    setEditandoId(pedido.id)
  }

  function agregarItem() {
    setItemsEdit([...itemsEdit, { name: "", quantity: 1, price: 0 }])
  }

  function actualizarItem(idx: number, campo: keyof PedidoItem, valor: any) {
    setItemsEdit(itemsEdit.map((item, i) => i === idx ? { ...item, [campo]: valor } : item))
  }

  function eliminarItem(idx: number) {
    setItemsEdit(itemsEdit.filter((_, i) => i !== idx))
  }

  async function guardarEdicion() {
    if (!editandoId) return
    await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "editarPedido",
        id: editandoId,
        items: itemsEdit
      })
    })
    setEditandoId(null)
    setItemsEdit([])
    cargarPedidos()
  }

  // Contadores por filtro
  const contadores = {
    todos: pedidosAbiertos.length,
    mostrador: pedidosAbiertos.filter(p => clasificar(p) === "mostrador").length,
    mesas: pedidosAbiertos.filter(p => clasificar(p) === "mesas").length,
    envios: pedidosAbiertos.filter(p => clasificar(p) === "envios").length,
  }

  return (
    <div>
      {/* ACUMULADO DE VENTAS */}
      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-2xl bg-[#111] p-3 ring-1 ring-[#333]">
          <p className="text-[10px] font-bold uppercase text-gray-500">Mostrador</p>
          <p className="text-lg font-extrabold text-white">{formatPrice(acumulado.mostrador)}</p>
        </div>
        <div className="rounded-2xl bg-[#111] p-3 ring-1 ring-[#333]">
          <p className="text-[10px] font-bold uppercase text-gray-500">Mesas</p>
          <p className="text-lg font-extrabold text-white">{formatPrice(acumulado.mesas)}</p>
        </div>
        <div className="rounded-2xl bg-[#111] p-3 ring-1 ring-[#333]">
          <p className="text-[10px] font-bold uppercase text-gray-500">Envíos</p>
          <p className="text-lg font-extrabold text-white">{formatPrice(acumulado.envios)}</p>
        </div>
        <div className="rounded-2xl bg-[#ff751f] p-3">
          <p className="text-[10px] font-bold uppercase text-black/70">Total hoy</p>
          <p className="text-lg font-extrabold text-black">{formatPrice(acumulado.total)}</p>
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos Activos</h1>
          <p className="text-xs text-gray-400">{pedidosFiltrados.length} abierto(s)</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {[
          { id: "todos" as Filtro, label: "Todos" },
          { id: "mostrador" as Filtro, label: "Mostrador" },
          { id: "mesas" as Filtro, label: "Mesas" },
          { id: "envios" as Filtro, label: "Envíos" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              filtro === f.id ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] text-gray-300"
            }`}
          >
            {f.label} ({contadores[f.id]})
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
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const clase = clasificar(pedido)
            const isEditing = editandoId === pedido.id
            
            // Parsear items para mostrar
            let itemsMostrar: PedidoItem[] = pedido.items || []
            if (itemsMostrar.length === 0 && pedido.detalle) {
              itemsMostrar = pedido.detalle.split(" | ").map((d) => {
                const match = d.match(/^(\d+)x\s+(.+)$/)
                if (match) return { name: match[2], quantity: parseInt(match[1]), price: 0 }
                return { name: d, quantity: 1, price: 0 }
              })
            }

            return (
              <div
                key={pedido.id}
                className={`rounded-2xl p-4 ring-1 ${
                  pedido.entregado ? "bg-blue-950/30 ring-blue-500/30" : "bg-[#111] ring-[#333]"
                }`}
              >
                {/* HEADER DEL PEDIDO */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#ff751f] px-2 py-0.5 text-[10px] font-bold text-black">
                        {pedido.ubicacion}
                      </span>
                      <span className="text-[10px] text-gray-500">{pedido.fecha}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-mono text-gray-500">{pedido.id}</p>
                  </div>
                  <p className="text-xl font-extrabold text-[#ff751f]">{formatPrice(pedido.total)}</p>
                </div>

                {/* ITEMS */}
                {!isEditing ? (
                  <div className="mb-3 space-y-1 rounded-xl bg-[#0a0a0a] p-2">
                    {itemsMostrar.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-white">
                          <span className="font-bold text-[#ff751f]">{item.quantity}x</span>{" "}
                          {item.name}
                        </span>
                        {item.price > 0 && (
                          <span className="text-xs text-gray-400">{formatPrice(item.price * item.quantity)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* MODO EDICIÓN */
                  <div className="mb-3 space-y-2 rounded-xl bg-[#0a0a0a] p-2">
                    {itemsEdit.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => actualizarItem(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="w-12 rounded bg-[#1a1a1a] px-2 py-1 text-center text-xs text-white"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => actualizarItem(idx, "name", e.target.value)}
                          placeholder="Nombre"
                          className="flex-1 rounded bg-[#1a1a1a] px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => actualizarItem(idx, "price", parseInt(e.target.value) || 0)}
                          placeholder="$"
                          className="w-20 rounded bg-[#1a1a1a] px-2 py-1 text-right text-xs text-white"
                        />
                        <button
                          onClick={() => eliminarItem(idx)}
                          className="flex size-7 items-center justify-center rounded-full bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={agregarItem}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#1a1a1a] py-1.5 text-xs font-bold text-[#ff751f]"
                    >
                      <Plus className="size-3" /> Agregar item
                    </button>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setEditandoId(null); setItemsEdit([]) }}
                        className="flex-1 rounded-full bg-[#1a1a1a] py-1.5 text-xs font-bold text-gray-300"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={guardarEdicion}
                        className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#ff751f] py-1.5 text-xs font-bold text-black"
                      >
                        <Check className="size-3" /> Guardar
                      </button>
                    </div>
                  </div>
                )}

                {/* ACCIONES */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {/* BOTÓN ENTREGADO */}
                    <button
                      onClick={() => toggleEstado(pedido.id, "entregado")}
                      className={`flex size-10 items-center justify-center rounded-full transition-all ${
                        pedido.entregado
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                      title={pedido.entregado ? "Entregado" : "Marcar entregado"}
                    >
                      <HandCoins className="size-5" />
                    </button>

                    {/* BOTÓN PAGADO */}
                    <button
                      onClick={() => toggleEstado(pedido.id, "pagado")}
                      className={`flex size-10 items-center justify-center rounded-full transition-all ${
                        pedido.pagado
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                      title={pedido.pagado ? "Pagado" : "Marcar pagado"}
                    >
                      <Banknote className="size-5" />
                    </button>
                  </div>

                  {/* BOTÓN EDITAR */}
                  {!isEditing && (
                    <button
                      onClick={() => empezarEditar(pedido)}
                      className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-[#2a2a2a]"
                    >
                      <Edit3 className="size-3" /> Editar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}