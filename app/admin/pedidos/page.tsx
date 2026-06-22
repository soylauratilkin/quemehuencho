"use client"

import { useEffect, useState, useCallback } from "react"
import { HandCoins, Banknote, Edit3, Plus, Trash2, Check, Minus, Send, Bike } from "lucide-react"
import { formatPrice, fetchProductsFromGoogleSheet, MENU_CSV_URL, type Product } from "@/lib/menu-data"

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
type EstadoFiltro = "activos" | "todos"

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("activos")
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null)
  const [itemsEdit, setItemsEdit] = useState<PedidoItem[]>([])
  const [ubicacionEdit, setUbicacionEdit] = useState<string>("")
  const [reenviadoCliente, setReenviadoCliente] = useState<string | null>(null)
  const [reenviadoDelivery, setReenviadoDelivery] = useState<string | null>(null)
  const [ultimoPedidoId, setUltimoPedidoId] = useState<string | null>(null)
  const [enviosNuevos, setEnviosNuevos] = useState(false)
  const [audioDesbloqueado, setAudioDesbloqueado] = useState(false)


  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const filtroParam = params.get("filtro")
      if (filtroParam === "envios" || filtroParam === "mostrador" || filtroParam === "mesas") {
        setFiltro(filtroParam as Filtro)
      }
    }
  }, [])

  // Desbloquear audio con cualquier interacción del usuario
  useEffect(() => {
    function desbloquearAudio() {
      if (!audioDesbloqueado) {
        const audio = new Audio("/sounds/notificacion.mp3")
        audio.volume = 0.01  // Volumen casi cero para no molestar
        audio.play()
          .then(() => {
            setAudioDesbloqueado(true)
            audio.pause()
          })
          .catch(e => console.log("Audio aún bloqueado"))
      }
    }
    
    document.addEventListener("click", desbloquearAudio, { once: true })
    document.addEventListener("touchstart", desbloquearAudio, { once: true })
    
    return () => {
      document.removeEventListener("click", desbloquearAudio)
      document.removeEventListener("touchstart", desbloquearAudio)
    }
  }, [audioDesbloqueado])
  
  useEffect(() => {
    async function loadProducts() {
      try {
        const fetched = await fetchProductsFromGoogleSheet(MENU_CSV_URL)
        setProductos(fetched)
      } catch (e) {
        console.error("Error cargando productos:", e)
      }
    }
    loadProducts()
  }, [])

const cargarPedidos = useCallback(async () => {
  setIsLoading(true)
  try {
    const res = await fetch("/api/admin/pedidos")
    const data = await res.json()
    const nuevosPedidos: Pedido[] = data.pedidos || []
    
    // Detectar pedido nuevo (cualquier origen)
    if (ultimoPedidoId && nuevosPedidos.length > 0) {
      const pedidoMasReciente = nuevosPedidos[0]
      
      // Si es un pedido nuevo diferente al último conocido
      if (pedidoMasReciente.id !== ultimoPedidoId) {
        // Solo sonido para pedidos web
        if (pedidoMasReciente.origen === "web") {
          if (audioDesbloqueado) {
            try {
              const audio = new Audio("/sounds/notificacion.mp3")
              audio.volume = 0.7
              audio.play().catch(e => console.log("No se pudo reproducir sonido:", e))
            } catch (e) {
              console.log("Error con sonido:", e)
            }
          }
          
          // Si es envío, titilar botón
          if (clasificar(pedidoMasReciente) === "envios") {
            setEnviosNuevos(true)
            setTimeout(() => setEnviosNuevos(false), 5000)
          }
        }
      }
    }
    
    // Siempre actualizar el último ID conocido
    if (nuevosPedidos.length > 0) {
      setUltimoPedidoId(nuevosPedidos[0].id)
    }
    
    setPedidos(nuevosPedidos)
  } catch (e) {
    console.error(e)
  } finally {
    setIsLoading(false)
  }
}, [ultimoPedidoId, audioDesbloqueado])

  useEffect(() => {
    cargarPedidos()
    const interval = setInterval(cargarPedidos, 15000)
    return () => clearInterval(interval)
  }, [cargarPedidos])

  async function toggleEstado(id: string, tipo: "entregado" | "pagado") {
    const res = await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: tipo, id })
    })
    const data = await res.json()
    
    // Si es entregado y hay link de WhatsApp, abrirlo
    if (tipo === "entregado" && data.linkWhatsapp) {
      window.open(data.linkWhatsapp, "_blank")
    }
    
    cargarPedidos()
  }

  async function borrarPedido(id: string) {
  if (!confirm("¿Estás seguro de borrar este pedido? Esta acción no se puede deshacer.")) {
    return
  }
  
  await fetch("/api/admin/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "borrarPedido", id })
  })
  cargarPedidos()
}

  async function reenviarCliente(id: string) {
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reenviarCliente", id })
      })
      const data = await res.json()
      if (data.success && data.link) {
        window.open(data.link, "_blank")
        setReenviadoCliente(id)
        setTimeout(() => setReenviadoCliente(null), 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function reenviarDelivery(id: string) {
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reenviarDelivery", id })
      })
      const data = await res.json()
      if (data.success && data.link) {
        window.open(data.link, "_blank")
        setReenviadoDelivery(id)
        setTimeout(() => setReenviadoDelivery(null), 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  function clasificar(p: Pedido): "mostrador" | "mesas" | "envios" {
    const ub = p.ubicacion?.toLowerCase() || ""
    if (p.origen === "web" || ub.includes("envio") || ub.includes("retiro") || ub === "web") {
      return "envios"
    }
    if (ub === "mostrador") return "mostrador"
    return "mesas"
  }

const pedidosHoy = pedidos.filter((p) => {
  try {
    const match = p.id.match(/^QMH-(\d+)$/)
    if (!match) return true
    
    const timestamp = parseInt(match[1])
    const fechaPedido = new Date(timestamp)
    const ahora = new Date()
    
    // Comparar solo la fecha (día/mes/año) en hora Argentina
    const fechaPedidoARG = new Date(fechaPedido.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    const ahoraARG = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    
    return (
      fechaPedidoARG.getFullYear() === ahoraARG.getFullYear() &&
      fechaPedidoARG.getMonth() === ahoraARG.getMonth() &&
      fechaPedidoARG.getDate() === ahoraARG.getDate()
    )
  } catch (e) {
    return true
  }
})

  const pedidosPorUbicacion = pedidosHoy.filter((p) => {
    if (filtro === "todos") return true
    return clasificar(p) === filtro
  })

  const pedidosFiltrados = pedidosPorUbicacion.filter((p) => {
    if (estadoFiltro === "todos") return true
    // "activos" = NO están entregado Y pagado (ambas cosas)
    return !(p.entregado && p.pagado)
  })

  const calcularTotales = (lista: Pedido[]) => ({
    mostrador: lista.filter(p => clasificar(p) === "mostrador").reduce((acc, p) => acc + (p.total || 0), 0),
    mesas: lista.filter(p => clasificar(p) === "mesas").reduce((acc, p) => acc + (p.total || 0), 0),
    envios: lista.filter(p => clasificar(p) === "envios").reduce((acc, p) => acc + (p.total || 0), 0),
    total: lista.reduce((acc, p) => acc + (p.total || 0), 0),
  })

  const acumuladoFacturado = calcularTotales(pedidosHoy)
  const acumuladoPendiente = calcularTotales(pedidosHoy.filter(p => !p.pagado))

  const contadores = {
    todos: estadoFiltro === "activos" 
      ? pedidosHoy.filter(p => !(p.entregado && p.pagado)).length 
      : pedidosHoy.length,
    mostrador: estadoFiltro === "activos"
      ? pedidosHoy.filter(p => clasificar(p) === "mostrador" && !(p.entregado && p.pagado)).length
      : pedidosHoy.filter(p => clasificar(p) === "mostrador").length,
    mesas: estadoFiltro === "activos"
      ? pedidosHoy.filter(p => clasificar(p) === "mesas" && !(p.entregado && p.pagado)).length
      : pedidosHoy.filter(p => clasificar(p) === "mesas").length,
    envios: estadoFiltro === "activos"
      ? pedidosHoy.filter(p => clasificar(p) === "envios" && !(p.entregado && p.pagado)).length
      : pedidosHoy.filter(p => clasificar(p) === "envios").length,
  }

  function getProductosDisponibles(origen: string): Product[] {
    if (origen === "web") {
      return productos.filter(p => (p.category as string) !== "local")
    }
    return productos
  }

  function empezarEditar(pedido: Pedido) {
    let items: PedidoItem[] = pedido.items || []
    
    if (items.length === 0 && pedido.detalle) {
      items = pedido.detalle.split(" | ").map((d) => {
        const match = d.match(/^(\d+)x\s+(.+)$/)
        if (match) {
          const nombre = match[2]
          const prod = productos.find(p => p.name.toLowerCase() === nombre.toLowerCase())
          return { 
            productId: prod?.id,
            name: prod?.name || nombre, 
            quantity: parseInt(match[1]), 
            price: prod?.price || 0 
          }
        }
        return { name: d, quantity: 1, price: 0 }
      }).filter(i => i.name && i.name.trim() !== "")
    }
    
    setItemsEdit(items)
    setPedidoEditando(pedido)
    setUbicacionEdit(pedido.ubicacion)
    setEditandoId(pedido.id)
  }

  function agregarItem() {
    const disponibles = pedidoEditando ? getProductosDisponibles(pedidoEditando.origen) : productos
    if (disponibles.length === 0) return
    
    const primerProd = disponibles[0]
    setItemsEdit([...itemsEdit, { 
      productId: primerProd.id,
      name: primerProd.name, 
      quantity: 1, 
      price: primerProd.price 
    }])
  }

  function actualizarItem(idx: number, productId: string) {
    const prod = productos.find(p => p.id === productId)
    if (!prod) return
    
    setItemsEdit(itemsEdit.map((item, i) => 
      i === idx 
        ? { ...item, productId: prod.id, name: prod.name, price: prod.price }
        : item
    ))
  }

  function cambiarCantidad(idx: number, delta: number) {
    setItemsEdit(itemsEdit.map((item, i) => {
      if (i !== idx) return item
      const nuevaCantidad = Math.max(1, item.quantity + delta)
      return { ...item, quantity: nuevaCantidad }
    }))
  }

  function eliminarItem(idx: number) {
    setItemsEdit(itemsEdit.filter((_, i) => i !== idx))
  }

  function calcularTotal(items: PedidoItem[]): number {
    return items.reduce((acc, item) => {
      const price = Number(item.price) || 0
      const qty = Number(item.quantity) || 0
      return acc + (price * qty)
    }, 0)
  }

  async function guardarEdicion() {
    if (!editandoId || itemsEdit.length === 0) return
    
    const itemsValidos = itemsEdit.filter(i => i.name && i.name.trim() !== "" && i.productId)
    
    if (itemsValidos.length === 0) {
      alert("Debe haber al menos un item válido")
      return
    }
    
    await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "editarPedido",
        id: editandoId,
        items: itemsValidos,
        ubicacion: ubicacionEdit
      })
    })
    setEditandoId(null)
    setPedidoEditando(null)
    setItemsEdit([])
    setUbicacionEdit("")
    cargarPedidos()
  }

  const acumuladoMostrar = estadoFiltro === "activos" ? acumuladoPendiente : acumuladoFacturado
  const labelAcumulado = estadoFiltro === "activos" ? "Pendiente" : "Facturado"

  return (
    <div>
      {/* ACUMULADO DE VENTAS */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-2xl bg-[#111] p-3 ring-1 ring-[#333]">
          <p className="text-[10px] font-bold uppercase text-gray-500">Mostrador</p>
          <p className="text-lg font-extrabold text-white">{formatPrice(acumuladoMostrar.mostrador)}</p>
        </div>
        <div className="rounded-2xl bg-[#111] p-3 ring-1 ring-[#333]">
          <p className="text-[10px] font-bold uppercase text-gray-500">Mesas</p>
          <p className="text-lg font-extrabold text-white">{formatPrice(acumuladoMostrar.mesas)}</p>
        </div>
        <div className="rounded-2xl bg-[#111] p-3 ring-1 ring-[#333]">
          <p className="text-[10px] font-bold uppercase text-gray-500">Envíos</p>
          <p className="text-lg font-extrabold text-white">{formatPrice(acumuladoMostrar.envios)}</p>
        </div>
        <div className="rounded-2xl bg-[#ff751f] p-3">
          <p className="text-[10px] font-bold uppercase text-black/70">Total {labelAcumulado}</p>
          <p className="text-lg font-extrabold text-black">{formatPrice(acumuladoMostrar.total)}</p>
        </div>
      </div>

      {/* TOGGLE: Activos vs Todos */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setEstadoFiltro("activos")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              estadoFiltro === "activos" ? "bg-red-500 text-white" : "bg-[#1a1a1a] text-gray-400"
            }`}
          >
            Solo activos
          </button>
          <button
            onClick={() => setEstadoFiltro("todos")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              estadoFiltro === "todos" ? "bg-green-500 text-white" : "bg-[#1a1a1a] text-gray-400"
            }`}
          >
            Ver todos
          </button>
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos del Día</h1>
          <p className="text-xs text-gray-400">{pedidosFiltrados.length} pedido(s)</p>
        </div>
      </div>

      {/* FILTROS DE UBICACIÓN */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {[
          { id: "todos" as Filtro, label: "Todos" },
          { id: "mostrador" as Filtro, label: "Mostrador" },
          { id: "mesas" as Filtro, label: "Mesas" },
          { id: "envios" as Filtro, label: "Envíos" },
        ].map((f) => {
          // Lógica especial para el botón de Envíos
          if (f.id === "envios") {
            return (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  filtro === f.id 
                    ? "bg-[#ff751f] text-black" 
                    : enviosNuevos 
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-[#1a1a1a] text-gray-300"
                }`}
              >
                {f.label} ({contadores[f.id]})
              </button>
            )
          }
          
          // Resto de botones (Todos, Mostrador, Mesas)
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                filtro === f.id ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] text-gray-300"
              }`}
            >
              {f.label} ({contadores[f.id]})
            </button>
          )
        })}
      </div>

      {/* LISTA DE PEDIDOS */}
      {isLoading && pedidos.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff751f] border-t-transparent" />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="rounded-3xl bg-[#111] p-12 text-center ring-1 ring-[#333]">
          <p className="text-lg font-bold text-gray-400">No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const isEditing = editandoId === pedido.id
            
            let itemsMostrar: PedidoItem[] = pedido.items || []
            if (itemsMostrar.length === 0 && pedido.detalle) {
              itemsMostrar = pedido.detalle.split(" | ").map((d) => {
                const match = d.match(/^(\d+)x\s+(.+)$/)
                if (match) {
                  const nombre = match[2]
                  const prod = productos.find(p => p.name.toLowerCase() === nombre.toLowerCase())
                  return { 
                    productId: prod?.id,
                    name: prod?.name || nombre, 
                    quantity: parseInt(match[1]), 
                    price: prod?.price || 0 
                  }
                }
                return { name: d, quantity: 1, price: 0 }
              }).filter(i => i.name && i.name.trim() !== "")
            }

            const productosDisponibles = getProductosDisponibles(pedido.origen)

            return (
              <div
                key={pedido.id}
                className={`rounded-2xl p-4 ring-1 ${
                  pedido.pagado 
                    ? "bg-green-950/20 ring-green-500/30 opacity-60"
                    : pedido.entregado 
                    ? "bg-blue-950/30 ring-blue-500/30" 
                    : "bg-[#111] ring-[#333]"
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
                  <p className="text-xl font-extrabold text-[#ff751f]">
                    {isEditing ? formatPrice(calcularTotal(itemsEdit)) : formatPrice(pedido.total)}
                  </p>
                </div>

                {/* ITEMS */}
                {!isEditing ? (
                  <div className="mb-3 space-y-1 rounded-xl bg-[#0a0a0a] p-2">
                    {itemsMostrar.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Sin items</p>
                    ) : (
                      itemsMostrar.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-white">
                            <span className="font-bold text-[#ff751f]">{item.quantity}x</span>{" "}
                            {item.name}
                          </span>
                          {item.price > 0 && (
                            <span className="text-xs text-gray-400">{formatPrice(item.price * item.quantity)}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="mb-3 space-y-2 rounded-xl bg-[#0a0a0a] p-2">

                    {/* SELECTOR DE UBICACIÓN */}
                    <div className="mb-2">
                      <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Ubicación</label>
                      <select
                        value={ubicacionEdit}
                        onChange={(e) => setUbicacionEdit(e.target.value)}
                        className="w-full rounded-lg bg-[#0a0a0a] px-3 py-2 text-xs text-white ring-1 ring-[#333]"
                      >
                        <option value="Mostrador">Mostrador</option>
                        <option value="Mesa 1">Mesa 1</option>
                        <option value="Mesa 2">Mesa 2</option>
                        <option value="Mesa 3">Mesa 3</option>
                        <option value="Mesa 4">Mesa 4</option>
                        <option value="Mesa 5">Mesa 5</option>
                        <option value="Baúl">Baúl</option>
                      </select>
                    </div>
                    {itemsEdit.map((item, idx) => (
                      <div key={idx} className="rounded-lg bg-[#1a1a1a] p-2 space-y-2">
                        <select
                          value={item.productId || ""}
                          onChange={(e) => actualizarItem(idx, e.target.value)}
                          className="w-full rounded bg-[#0a0a0a] px-2 py-1.5 text-xs text-white ring-1 ring-[#333]"
                        >
                          <option value="">-- Seleccionar producto --</option>
                          {productosDisponibles.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} - {formatPrice(prod.price)}
                            </option>
                          ))}
                        </select>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => cambiarCantidad(idx, -1)}
                              disabled={item.quantity <= 1}
                              className="flex size-8 items-center justify-center rounded-full bg-[#ff751f] text-black disabled:opacity-30"
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => cambiarCantidad(idx, 1)}
                              className="flex size-8 items-center justify-center rounded-full bg-[#ff751f] text-black"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#ff751f]">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => eliminarItem(idx)}
                              className="flex size-7 items-center justify-center rounded-full bg-red-500/20 text-red-400"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={agregarItem}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#1a1a1a] py-2 text-xs font-bold text-[#ff751f] ring-1 ring-[#333]"
                    >
                      <Plus className="size-3" /> Agregar item
                    </button>
                    
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setEditandoId(null); setPedidoEditando(null); setItemsEdit([]);setUbicacionEdit("") }}
                        className="flex-1 rounded-full bg-[#1a1a1a] py-2 text-xs font-bold text-gray-300"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={guardarEdicion}
                        className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#ff751f] py-2 text-xs font-bold text-black"
                      >
                        <Check className="size-3" /> Guardar
                      </button>
                    </div>
                  </div>
                )}

{/* ACCIONES */}
<div className="flex items-center justify-between flex-wrap gap-2">
  <div className="flex gap-2 flex-wrap">
    <button
      onClick={() => toggleEstado(pedido.id, "entregado")}
      className={`flex size-10 items-center justify-center rounded-full transition-all ${
        pedido.entregado ? "bg-green-500 text-white" : "bg-red-500 text-white hover:bg-red-600"
      }`}
    >
      <HandCoins className="size-5" />
    </button>
    <button
      onClick={() => toggleEstado(pedido.id, "pagado")}
      className={`flex size-10 items-center justify-center rounded-full transition-all ${
        pedido.pagado ? "bg-green-500 text-white" : "bg-red-500 text-white hover:bg-red-600"
      }`}
    >
      <Banknote className="size-5" />
    </button>
    {pedido.origen === "web" && (
      <button
        onClick={() => reenviarCliente(pedido.id)}
        className={`flex size-10 items-center justify-center rounded-full transition-all ${
          reenviadoCliente === pedido.id ? "bg-green-500 text-white" : "bg-red-500 text-white hover:bg-red-600"
        }`}
        title="Reenviar confirmación al cliente"
      >
        <Send className="size-5" />
      </button>
    )}
    {clasificar(pedido) === "envios" && pedido.ubicacion !== "Retiro" && pedido.origen === "web" && (
      <button
        onClick={() => reenviarDelivery(pedido.id)}
        className={`flex size-10 items-center justify-center rounded-full transition-all ${
          reenviadoDelivery === pedido.id ? "bg-green-500 text-white" : "bg-red-500 text-white hover:bg-red-600"
        }`}
        title="Reenviar al delivery"
      >
        <Bike className="size-5" />
      </button>
    )}
  </div>

  {!isEditing && (
    <div className="flex gap-2">
      <button
        onClick={() => empezarEditar(pedido)}
        className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-[#2a2a2a]"
      >
        <Edit3 className="size-3" /> Editar
      </button>
      
      {/* ← BOTÓN BORRAR AGREGADO ACÁ */}
      <button
        onClick={() => borrarPedido(pedido.id)}
        className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
      >
        <Trash2 className="size-3" /> Borrar
      </button>
    </div>
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