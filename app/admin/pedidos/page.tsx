"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { HandCoins, Banknote, Edit3, Plus, Trash2, Check, Minus, Send, Bike, Car } from "lucide-react"
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
  confirmadoCliente?: string
  listoRetiro?: string
  telefono?: string
}

type Filtro = "todos" | "mostrador" | "mesas" | "envios"
type EstadoFiltro = "activos" | "todos"

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("activos")
  
  // Estados de edición
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null)
  const [itemsEdit, setItemsEdit] = useState<PedidoItem[]>([])
  const [ubicacionEdit, setUbicacionEdit] = useState<string>("")
  const [telefonoEdit, setTelefonoEdit] = useState<string>("")
  
  // Estados de notificación
  const [reenviadoCliente, setReenviadoCliente] = useState<string | null>(null)
  const [reenviadoDelivery, setReenviadoDelivery] = useState<string | null>(null)
  const [ultimoPedidoId, setUltimoPedidoId] = useState<string | null>(null)
  const [enviosNuevos, setEnviosNuevos] = useState(false)
  const [alarmaActiva, setAlarmaActiva] = useState(false)
  
  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioDesbloqueado, setAudioDesbloqueado] = useState(false)

  // 1. Inicializar audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sounds/notificacion.mp3")
      audio.volume = 0.7
      audio.loop = true
      audioRef.current = audio
    }
  }, [])

  // 2. Desbloquear audio
  useEffect(() => {
    function desbloquearAudio() {
      if (!audioDesbloqueado && audioRef.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current!.pause()
            audioRef.current!.currentTime = 0
            setAudioDesbloqueado(true)
          })
          .catch(() => {})
      }
    }
    document.addEventListener("click", desbloquearAudio, { once: true })
    document.addEventListener("touchstart", desbloquearAudio, { once: true })
    return () => {
      document.removeEventListener("click", desbloquearAudio)
      document.removeEventListener("touchstart", desbloquearAudio)
    }
  }, [audioDesbloqueado])

  // 3. Cargar productos
  useEffect(() => {
    fetchProductsFromGoogleSheet(MENU_CSV_URL)
      .then(setProductos)
      .catch(console.error)
  }, [])

  // 4. Control de audio
  const reproducirSonido = useCallback(() => {
    if (audioDesbloqueado && audioRef.current && !alarmaActiva) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
      setAlarmaActiva(true)
    }
  }, [audioDesbloqueado, alarmaActiva])

  const detenerSonido = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setAlarmaActiva(false)
    setEnviosNuevos(false)
  }, [])

  // 5. Cargar pedidos (Polling)
  const cargarPedidos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pedidos")
      const data = await res.json()
      const nuevosPedidos: Pedido[] = data.pedidos || []

      if (nuevosPedidos.length > 0) {
        const pedidoMasReciente = nuevosPedidos[0]
        if (ultimoPedidoId && pedidoMasReciente.id !== ultimoPedidoId) {
          // ✅ AHORA SUENA PARA CUALQUIER PEDIDO (Mesa, Delivery, Retiro)
          reproducirSonido()
          if (clasificarPedido(pedidoMasReciente) === "envios") {
            setEnviosNuevos(true)
          }
          
        }
        setUltimoPedidoId(pedidoMasReciente.id)
      }
      setPedidos(nuevosPedidos)
    } catch (e) {
      console.error("Error cargando pedidos:", e)
    } finally {
      setIsLoading(false)
    }
  }, [ultimoPedidoId, reproducirSonido])

  useEffect(() => {
    cargarPedidos()
    const interval = setInterval(cargarPedidos, 10000)
    return () => clearInterval(interval)
  }, [cargarPedidos])

  // --- FUNCIONES DE ACCIÓN ---
  async function toggleEstado(id: string, tipo: "entregado" | "pagado") {
    const res = await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: tipo, id })
    })
    const data = await res.json()
    if (tipo === "entregado" && data.linkWhatsapp) {
      window.open(data.linkWhatsapp, "_blank")
    }
    cargarPedidos()
  }

  async function borrarPedido(id: string) {
    if (!confirm("¿Estás seguro de borrar este pedido?")) return
    await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "borrarPedido", id })
    })
    cargarPedidos()
  }

  async function reenviarCliente(id: string) {
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
  }

  async function reenviarDelivery(id: string) {
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
  }

  async function listoRetiro(id: string) {
    const res = await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "listoRetiro", id })
    })
    const data = await res.json()
    if (data.success && data.link) {
      window.open(data.link, "_blank")
      cargarPedidos()
    }
  }

async function avisarListo(pedido: any) {
  try {
    // 1. Le pedimos a Apps Script que guarde la hora y nos devuelva el link
    const res = await fetch("/api/admin/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "listoRetiro", id: pedido.id })
    })
    
    const data = await res.json()
    
    if (data.success && data.link) {
      // 2. Abrimos WhatsApp
      window.open(data.link, "_blank")
      // 3. Recargamos los pedidos para que se actualice el badge de "ListoRetiro"
      cargarPedidos()
    } else {
      alert("Error: " + (data.error || "No se pudo generar el aviso"))
    }
  } catch (e) {
    console.error(e)
    alert("Error de conexión al avisar que está listo")
  }
}

function clasificarPedido(p: Pedido): "mostrador" | "mesas" | "envios" {
  const ub = p.ubicacion?.toLowerCase() || ""
  // ✅ Agregamos "doblefila" para que caiga en la pestaña de envíos
  if (p.origen === "web" || ub.includes("envio") || ub.includes("retiro") || ub === "web" || ub.includes("doblefila")) {
    return "envios"
  }
  if (ub === "mostrador") return "mostrador"
  return "mesas"
}

  // 🚀 OPTIMIZACIÓN CLAVE: useMemo evita recalcular esto en cada render
  const pedidosHoy = useMemo(() => {
    return pedidos.filter((p) => {
      try {
        const match = p.id.match(/^QMH-(\d+)$/)
        if (!match) return true
        const fechaPedido = new Date(parseInt(match[1]))
        const ahora = new Date()
        const fArg = new Date(fechaPedido.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
        const aArg = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
        return fArg.getFullYear() === aArg.getFullYear() && fArg.getMonth() === aArg.getMonth() && fArg.getDate() === aArg.getDate()
      } catch { return true }
    })
  }, [pedidos])

  const pedidosFiltrados = useMemo(() => {
    return pedidosHoy.filter((p) => {
      const matchFiltro = filtro === "todos" || clasificarPedido(p) === filtro
      const matchEstado = estadoFiltro === "todos" || !(p.entregado && p.pagado)
      return matchFiltro && matchEstado
    })
  }, [pedidosHoy, filtro, estadoFiltro])

  const contadores = useMemo(() => {
    const esActivo = (p: Pedido) => estadoFiltro === "activos" ? !(p.entregado && p.pagado) : true
    return {
      todos: pedidosHoy.filter(esActivo).length,
      mostrador: pedidosHoy.filter(p => clasificarPedido(p) === "mostrador" && esActivo(p)).length,
      mesas: pedidosHoy.filter(p => clasificarPedido(p) === "mesas" && esActivo(p)).length,
      envios: pedidosHoy.filter(p => clasificarPedido(p) === "envios" && esActivo(p)).length,
    }
  }, [pedidosHoy, estadoFiltro])

  const acumuladoMostrar = useMemo(() => {
    const lista = estadoFiltro === "activos" ? pedidosHoy.filter(p => !p.pagado) : pedidosHoy
    const calc = (f: Filtro) => lista.filter(p => clasificarPedido(p) === f).reduce((acc, p) => acc + (p.total || 0), 0)
    return {
      mostrador: calc("mostrador"),
      mesas: calc("mesas"),
      envios: calc("envios"),
      total: lista.reduce((acc, p) => acc + (p.total || 0), 0),
    }
  }, [pedidosHoy, estadoFiltro])

  // --- LÓGICA DE EDICIÓN ---
  function getProductosDisponibles(origen: string) {
    return origen === "web" ? productos.filter(p => (p.category as string) !== "local") : productos
  }

  function empezarEditar(pedido: Pedido) {
    let items: PedidoItem[] = pedido.items || []
    if (items.length === 0 && pedido.detalle) {
      items = pedido.detalle.split(" | ").map((d) => {
        const match = d.match(/^(\d+)x\s+(.+)$/)
        if (match) {
          const nombre = match[2]
          const prod = productos.find(p => p.name.toLowerCase() === nombre.toLowerCase())
          return { productId: prod?.id, name: prod?.name || nombre, quantity: parseInt(match[1]), price: prod?.price || 0 }
        }
        return { name: d, quantity: 1, price: 0 }
      }).filter(i => i.name && i.name.trim() !== "")
    }
    setItemsEdit(items)
    setPedidoEditando(pedido)
    setUbicacionEdit(pedido.ubicacion)
    setTelefonoEdit(pedido.telefono || "") // ✅ NUEVO
    setEditandoId(pedido.id)
  }

  function actualizarItem(idx: number, productId: string) {
    const prod = productos.find(p => p.id === productId)
    if (!prod) return
    setItemsEdit(itemsEdit.map((item, i) => i === idx ? { ...item, productId: prod.id, name: prod.name, price: prod.price } : item))
  }

  function cambiarCantidad(idx: number, delta: number) {
    setItemsEdit(itemsEdit.map((item, i) => i !== idx ? item : { ...item, quantity: Math.max(1, item.quantity + delta) }))
  }

  function eliminarItem(idx: number) {
    setItemsEdit(itemsEdit.filter((_, i) => i !== idx))
  }

  function calcularTotal(items: PedidoItem[]) {
    return items.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0)
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
      ubicacion: ubicacionEdit,
      telefono: telefonoEdit // ✅ NUEVO
    })
  })
  
  setEditandoId(null)
  setPedidoEditando(null)
  setItemsEdit([])
  setUbicacionEdit("")
  setTelefonoEdit("") // ✅ NUEVO
  cargarPedidos()
}

  const labelAcumulado = estadoFiltro === "activos" ? "Pendiente" : "Facturado"

  return (
    <div className="w-full p-2 md:p-4">
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
          <button onClick={() => setEstadoFiltro("activos")} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${estadoFiltro === "activos" ? "bg-red-500 text-white" : "bg-[#1a1a1a] text-gray-400"}`}>Solo activos</button>
          <button onClick={() => setEstadoFiltro("todos")} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${estadoFiltro === "todos" ? "bg-green-500 text-white" : "bg-[#1a1a1a] text-gray-400"}`}>Ver todos</button>
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos del Día</h1>
          <p className="text-xs text-gray-400">{pedidosFiltrados.length} pedido(s)</p>
        </div>
      </div>

      {/* FILTROS DE UBICACIÓN (AQUÍ ESTÁ LA MAGIA PARA DETENER EL SONIDO) */}
      {/* FILTROS DE UBICACIÓN (Optimizado para celular) */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 whitespace-nowrap">
        {(["todos", "mostrador", "mesas", "envios"] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFiltro(f)
              if (alarmaActiva) detenerSonido()
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] md:text-xs font-bold transition-all flex items-center gap-1 border ${
              filtro === f 
                ? "bg-[#ff751f] text-black border-[#ff751f]" 
                : f === "envios" && enviosNuevos 
                ? "bg-red-500 text-white border-red-500 animate-pulse"
                : "bg-[#1a1a1a] text-gray-300 border-[#333]"
            }`}
          >
            {/* Emojis ligeramente más pequeños para no robar espacio */}
            {f === "envios" && <span className="text-[10px]">🛵</span>}
            {f === "mesas" && <span className="text-[10px]">☕</span>}
            {f === "mostrador" && <span className="text-[10px]">🏪</span>}
            
            <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
            <span className="opacity-70">({contadores[f]})</span>
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
          <p className="text-lg font-bold text-gray-400">No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const isEditing = editandoId === pedido.id
            const isDoblefila = pedido.ubicacion?.toLowerCase().includes("doblefila")
            let itemsMostrar: PedidoItem[] = pedido.items || []
            if (itemsMostrar.length === 0 && pedido.detalle) {
              itemsMostrar = pedido.detalle.split(" | ").map((d) => {
                const match = d.match(/^(\d+)x\s+(.+)$/)
                if (match) {
                  const nombre = match[2]
                  const prod = productos.find(p => p.name.toLowerCase() === nombre.toLowerCase())
                  return { productId: prod?.id, name: prod?.name || nombre, quantity: parseInt(match[1]), price: prod?.price || 0 }
                }
                return { name: d, quantity: 1, price: 0 }
              }).filter(i => i.name && i.name.trim() !== "")
            }
            const productosDisponibles = getProductosDisponibles(pedido.origen)

            return (
              <div
                key={pedido.id}
                className={`rounded-2xl p-4 transition-all ${
                  pedido.pagado 
                    ? "bg-green-950/20 ring-1 ring-green-500/30 opacity-60"
                    : pedido.entregado 
                    ? "bg-blue-950/30 ring-1 ring-blue-500/30" 
                    : isDoblefila
                    ? "bg-green-900/20 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" // 🟢 VERDE DOBLEFILA
                    : (pedido.origen === "mesa")
                    ? "bg-[#a855f7]/10 border-2 border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "bg-[#111] ring-1 ring-[#333]"
                }`}
              >
                {/* HEADER DEL PEDIDO */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isDoblefila ? "bg-green-500 text-black" : "bg-[#ff751f] text-black"
                      }`}>
                        {pedido.ubicacion}
                      </span>
                      <span className="text-[10px] text-gray-500">{pedido.fecha}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-mono text-gray-500">{pedido.id}</p>
                  </div>
                  <p className="text-xl font-extrabold text-[#ff751f]">{isEditing ? formatPrice(calcularTotal(itemsEdit)) : formatPrice(pedido.total)}</p>
                </div>

                {/* ITEMS */}
                {!isEditing ? (
                  <div className="mb-3 space-y-1 rounded-xl bg-[#0a0a0a] p-2">
                    {itemsMostrar.length === 0 ? <p className="text-xs text-gray-500 italic">Sin items</p> : itemsMostrar.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-white"><span className="font-bold text-[#ff751f]">{item.quantity}x</span> {item.name}</span>
                        {item.price > 0 && <span className="text-xs text-gray-400">{formatPrice(item.price * item.quantity)}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 space-y-2 rounded-xl bg-[#0a0a0a] p-2">
                    <div className="mb-2">
                      <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Ubicación</label>
                      <select value={ubicacionEdit} onChange={(e) => setUbicacionEdit(e.target.value)} className="w-full rounded-lg bg-[#0a0a0a] px-3 py-2 text-xs text-white ring-1 ring-[#333]">
                        {["Mostrador", "Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6", "Doblefila Express", "Retiro en local", "Envio"].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {/* ✅ CAMPO DE TELÉFONO (Solo si NO es Mesa ni Mostrador) */}
                    {!ubicacionEdit.toLowerCase().includes("mesa") && !ubicacionEdit.toLowerCase().includes("mostrador") && (
                      <div className="mb-2">
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Teléfono</label>
                        <input
                          type="tel"
                          value={telefonoEdit}
                          onChange={(e) => setTelefonoEdit(e.target.value.replace(/\D/g, ""))}
                          placeholder="Ej: 5492804007296"
                          className={`w-full rounded-lg bg-[#0a0a0a] px-3 py-2 text-xs text-white ring-1 transition-all ${
                            telefonoEdit.length > 0 && (telefonoEdit.length < 10 || telefonoEdit.length > 15)
                              ? "ring-red-500"
                              : "ring-[#333]"
                          }`}
                        />
                        {telefonoEdit.length > 0 && (telefonoEdit.length < 10 || telefonoEdit.length > 15) && (
                          <p className="text-[9px] text-red-400 mt-1">⚠️ Teléfono inválido (debe tener 10-15 dígitos)</p>
                        )}
                      </div>
                    )}
                    {itemsEdit.map((item, idx) => (
                      <div key={idx} className="rounded-lg bg-[#1a1a1a] p-2 space-y-2">
                        <select value={item.productId || ""} onChange={(e) => actualizarItem(idx, e.target.value)} className="w-full rounded bg-[#0a0a0a] px-2 py-1.5 text-xs text-white ring-1 ring-[#333]">
                          <option value="">-- Seleccionar producto --</option>
                          {productosDisponibles.map((prod) => (<option key={prod.id} value={prod.id}>{prod.name} - {formatPrice(prod.price)}</option>))}
                        </select>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => cambiarCantidad(idx, -1)} disabled={item.quantity <= 1} className="flex size-8 items-center justify-center rounded-full bg-[#ff751f] text-black disabled:opacity-30"><Minus className="size-4" /></button>
                            <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                            <button onClick={() => cambiarCantidad(idx, 1)} className="flex size-8 items-center justify-center rounded-full bg-[#ff751f] text-black"><Plus className="size-4" /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#ff751f]">{formatPrice(item.price * item.quantity)}</span>
                            <button onClick={() => eliminarItem(idx)} className="flex size-7 items-center justify-center rounded-full bg-red-500/20 text-red-400"><Trash2 className="size-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setItemsEdit([...itemsEdit, { productId: productosDisponibles[0]?.id, name: productosDisponibles[0]?.name || "Item", quantity: 1, price: productosDisponibles[0]?.price || 0 }])} className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#1a1a1a] py-2 text-xs font-bold text-[#ff751f] ring-1 ring-[#333]">
                      <Plus className="size-3" /> Agregar item
                    </button>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setEditandoId(null); setPedidoEditando(null); setItemsEdit([]); setUbicacionEdit("") }} className="flex-1 rounded-full bg-[#1a1a1a] py-2 text-xs font-bold text-gray-300">Cancelar</button>
                      <button onClick={guardarEdicion} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#ff751f] py-2 text-xs font-bold text-black"><Check className="size-3" /> Guardar</button>
                    </div>
                  </div>
                )}

                {/* ACCIONES - ALINEADAS Y SIN ESTIRAMIENTOS */}
                <div className="flex items-center justify-between flex-wrap gap-3 mt-3 pt-3 border-t border-[#333]/50">
                  
                  {/* GRUPO IZQUIERDO: Botones de Estado (Solo ocupan el espacio de sus íconos) */}
                  <div className="flex gap-2 flex-wrap">
                    
                    {/* ===== DOBLEFILA EXPRESS ===== */}
                    {isDoblefila && (
                      <>
                        {!pedido.entregado && pedido.origen === "web" && (
                          <button onClick={() => reenviarCliente(pedido.id)} className={`flex size-10 items-center justify-center rounded-full transition-all ${pedido.confirmadoCliente ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`} title="Confirmar al cliente">
                            <Send className="size-5" />
                          </button>
                        )}
                        {!pedido.entregado && (
                          <button onClick={() => avisarListo(pedido)} className={`flex size-10 items-center justify-center rounded-full transition-all ${pedido.listoRetiro ? "bg-green-500 text-white" : "bg-green-500 text-white hover:bg-green-600"}`} title="Avisar que está listo (Vereda)">
                            <Car className="size-5" />
                          </button>
                        )}
                        {!pedido.entregado && (
                          <button onClick={() => toggleEstado(pedido.id, "entregado")} className="flex size-10 items-center justify-center rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-all shadow-sm" title="Marcar como entregado">
                            <HandCoins className="size-5" />
                          </button>
                        )}
                        {!pedido.pagado && (
                          <button onClick={() => toggleEstado(pedido.id, "pagado")} className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all" title="Marcar como pagado">
                            <Banknote className="size-5" />
                          </button>
                        )}
                        {pedido.pagado && <div className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white"><Banknote className="size-5" /></div>}
                      </>
                    )}

                    {/* ===== RETIRO EN LOCAL ===== */}
                    {pedido.ubicacion?.toLowerCase().includes("retiro") && !isDoblefila && (
                      <>
                        {!pedido.entregado && pedido.origen === "web" && (
                          <button onClick={() => reenviarCliente(pedido.id)} className={`flex size-10 items-center justify-center rounded-full transition-all ${pedido.confirmadoCliente ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`} title="Confirmar al cliente">
                            <Send className="size-5" />
                          </button>
                        )}
                        {!pedido.entregado && pedido.origen === "web" && (
                          <button onClick={() => avisarListo(pedido)} className={`flex size-10 items-center justify-center rounded-full transition-all ${pedido.listoRetiro ? "bg-green-500 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`} title="Avisar que está listo">
                            <Check className="size-5" />
                          </button>
                        )}
                        {!pedido.entregado && (
                          <button onClick={() => toggleEstado(pedido.id, "entregado")} className="flex size-10 items-center justify-center rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-all shadow-sm" title="Marcar como entregado">
                            <HandCoins className="size-5" />
                          </button>
                        )}
                        {!pedido.pagado && (
                          <button onClick={() => toggleEstado(pedido.id, "pagado")} className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all" title="Marcar como pagado">
                            <Banknote className="size-5" />
                          </button>
                        )}
                        {pedido.pagado && <div className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white"><Banknote className="size-5" /></div>}
                      </>
                    )}

                    {/* ===== DELIVERY ===== */}
                    {clasificarPedido(pedido) === "envios" && !isDoblefila && !pedido.ubicacion?.toLowerCase().includes("retiro") && (
                      <>
                        {!pedido.entregado && pedido.origen === "web" && (
                          <button onClick={() => reenviarCliente(pedido.id)} className={`flex size-10 items-center justify-center rounded-full transition-all ${pedido.confirmadoCliente ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`} title="Confirmar al cliente">
                            <Send className="size-5" />
                          </button>
                        )}
                        {!pedido.entregado && pedido.origen === "web" && (
                          <button onClick={() => reenviarDelivery(pedido.id)} className={`flex size-10 items-center justify-center rounded-full transition-all ${reenviadoDelivery === pedido.id ? "bg-green-500 text-white" : "bg-purple-500 text-white hover:bg-purple-600"}`} title="Reenviar al delivery">
                            <Bike className="size-5" />
                          </button>
                        )}
                        {!pedido.entregado && (
                          <button onClick={() => avisarListo(pedido)} className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all" title="Avisar al delivery que está listo">
                            <Check className="size-5" />
                          </button>
                        )}
                        {!pedido.entregado && (
                          <button onClick={() => toggleEstado(pedido.id, "entregado")} className="flex size-10 items-center justify-center rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-all shadow-sm" title="Marcar como entregado">
                            <HandCoins className="size-5" />
                          </button>
                        )}
                        {!pedido.pagado && (
                          <button onClick={() => toggleEstado(pedido.id, "pagado")} className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all" title="Marcar como pagado">
                            <Banknote className="size-5" />
                          </button>
                        )}
                        {pedido.pagado && <div className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white"><Banknote className="size-5" /></div>}
                      </>
                    )}

                    {/* ===== MESA / MOSTRADOR (Fallback) ===== */}
                    {!isDoblefila && 
                    !pedido.ubicacion?.toLowerCase().includes("retiro") && 
                    clasificarPedido(pedido) !== "envios" && (
                      <>
                        {!pedido.entregado && (
                          <button onClick={() => toggleEstado(pedido.id, "entregado")} className="flex size-10 items-center justify-center rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-all shadow-sm" title="Marcar como entregado">
                            <HandCoins className="size-5" />
                          </button>
                        )}
                        {!pedido.pagado && (
                          <button onClick={() => toggleEstado(pedido.id, "pagado")} className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all" title="Marcar como pagado">
                            <Banknote className="size-5" />
                          </button>
                        )}
                        {pedido.pagado && (
                          <div className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white">
                            <Banknote className="size-5" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* GRUPO DERECHO: Edición y Borrado (Se quedan pegados a la derecha sin estirar el izquierdo) */}
                  {!isEditing && (
                    <div className="flex gap-2 ml-auto">
                      {!pedido.pagado && (
                        <button onClick={() => empezarEditar(pedido)} className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-[#2a2a2a] transition-colors">
                          <Edit3 className="size-3" /> Editar
                        </button>
                      )}
                      <button onClick={() => borrarPedido(pedido.id)} className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors">
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