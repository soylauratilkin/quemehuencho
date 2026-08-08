"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, ShoppingCart, DollarSign, Package, Bike, Store, Car, Users, LayoutGrid } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/menu-data"

type DashboardData = {
  totalHoy: number
  pedidosHoy: number
  promedioDiario: number
  ticketPromedio: number
  diasConVentas: number
  porTipo: {
    delivery: number
    retiro: number
    doblefila: number
    mesa: number
    mostrador: number
  }
  productosMasVendidos: Array<{ name: string; monto: number; cantidad: number }>
}

const DEFAULT_DATA: DashboardData = {
  totalHoy: 0,
  pedidosHoy: 0,
  promedioDiario: 0,
  ticketPromedio: 0,
  diasConVentas: 1,
  porTipo: { delivery: 0, retiro: 0, doblefila: 0, mesa: 0, mostrador: 0 },
  productosMasVendidos: []
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes">("mes")

  useEffect(() => {
    cargarDashboard()
  }, [periodo])

  async function cargarDashboard() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/dashboard?periodo=${periodo}`)
      const json = await res.json()
      
      setData({
        ...DEFAULT_DATA,
        ...json,
        porTipo: {
          ...DEFAULT_DATA.porTipo,
          ...(json.porTipo || {})
        },
        productosMasVendidos: json.productosMasVendidos || []
      })
    } catch (e) {
      console.error("Error cargando dashboard:", e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#ff751f] text-xl font-bold animate-pulse">Cargando métricas...</div>
      </div>
    )
  }

  // Calcular total de pedidos por tipo para los porcentajes
  const totalPedidosTipo = 
    (data.porTipo.delivery || 0) + 
    (data.porTipo.retiro || 0) + 
    (data.porTipo.doblefila || 0) + 
    (data.porTipo.mesa || 0) +
    (data.porTipo.mostrador || 0)

  // ✅ CORREGIDO: Por Día = Total / Días con ventas (no / pedidos)
  const promedioPorDia = data.diasConVentas > 0 
    ? Math.round((data.totalHoy || 0) / data.diasConVentas) 
    : 0

  return (
    <div className="min-h-dvh bg-[#0a0a0a] pb-20">
      {/* HEADER */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#333] bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur">
        <button onClick={() => router.push("/admin/pedidos")} className="flex size-10 items-center justify-center rounded-full bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-heading text-xl font-semibold text-white">Dashboard</h1>
      </header>

      {/* SELECTOR DE PERÍODO */}
      <div className="p-4">
        <div className="flex gap-2 rounded-2xl bg-[#111] p-1 ring-1 ring-[#333]">
          {(["hoy", "semana", "mes"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`flex-1 rounded-xl py-2 text-sm font-bold capitalize transition-all ${
                periodo === p ? "bg-[#ff751f] text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="space-y-4 px-4">
        {/* PROMEDIO DIARIO (DESTACADO) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#ff751f] to-[#ff751f]/80 p-6 text-black shadow-xl">
          <div className="mb-2 flex items-center gap-2 text-black/80">
            <TrendingUp className="size-5" />
            <span className="text-sm font-semibold">Promedio Diario</span>
          </div>
          <div className="text-4xl font-extrabold">{formatPrice(data.promedioDiario || 0)}</div>
          <p className="mt-2 text-xs text-black/70">Ventas promedio por día en el período seleccionado</p>
        </div>

        {/* GRID DE MÉTRICAS */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Total Vendido"
            value={data.totalHoy || 0}
            icon={<DollarSign className="size-5" />}
            color="bg-green-500/20 text-green-400"
          />
          <MetricCard
            title="Pedidos"
            value={data.pedidosHoy || 0}
            icon={<ShoppingCart className="size-5" />}
            color="bg-blue-500/20 text-blue-400"
            isNumber
          />
          <MetricCard
            title="Ticket Promedio"
            value={data.ticketPromedio || 0}
            icon={<Users className="size-5" />}
            color="bg-purple-500/20 text-purple-400"
          />
          <MetricCard
            title={`Por Día (${data.diasConVentas} días)`}
            value={promedioPorDia}
            icon={<Package className="size-5" />}
            color="bg-yellow-500/20 text-yellow-400"
          />
        </div>

        {/* 🥧 GRÁFICO DE TORTA: PEDIDOS POR TIPO */}
        {totalPedidosTipo > 0 && (
          <div className="rounded-3xl bg-[#111] p-5 ring-1 ring-[#333]">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400 flex items-center gap-2">
              <LayoutGrid className="size-4" /> Distribución por Tipo
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Torta SVG */}
              <div className="relative">
                <PieChart data={tipoData(data.porTipo)} size={160} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-white">{totalPedidosTipo}</span>
                  <span className="text-[10px] text-gray-400">pedidos</span>
                </div>
              </div>
              
              {/* Leyenda */}
              <div className="flex-1 space-y-2 w-full">
                <TypeLegend icon={<Bike className="size-3" />} label="Delivery" value={data.porTipo.delivery} total={totalPedidosTipo} color="bg-orange-500" />
                <TypeLegend icon={<Store className="size-3" />} label="Retiro" value={data.porTipo.retiro} total={totalPedidosTipo} color="bg-blue-500" />
                <TypeLegend icon={<Car className="size-3" />} label="Doblefila" value={data.porTipo.doblefila} total={totalPedidosTipo} color="bg-green-500" />
                <TypeLegend icon={<Users className="size-3" />} label="Mesa" value={data.porTipo.mesa} total={totalPedidosTipo} color="bg-purple-500" />
                <TypeLegend icon={<LayoutGrid className="size-3" />} label="Mostrador" value={data.porTipo.mostrador} total={totalPedidosTipo} color="bg-pink-500" />
              </div>
            </div>
          </div>
        )}

        {/* 🥧 GRÁFICO DE TORTA: PRODUCTOS POR IMPORTE */}
        {data.productosMasVendidos.length > 0 && (
          <div className="rounded-3xl bg-[#111] p-5 ring-1 ring-[#333]">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400 flex items-center gap-2">
              🔥 Top Productos por Importe
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Torta SVG */}
              <div className="relative">
                <PieChart data={productosData(data.productosMasVendidos)} size={160} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-white">{formatPrice(data.totalHoy || 0)}</span>
                  <span className="text-[10px] text-gray-400">total</span>
                </div>
              </div>
              
              {/* Lista de productos */}
              <div className="flex-1 space-y-2 w-full">
                {data.productosMasVendidos.slice(0, 5).map((prod, idx) => {
                  const porcentaje = data.totalHoy > 0 ? Math.round((prod.monto / data.totalHoy) * 100) : 0
                  const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500"]
                  return (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-[#1a1a1a] px-3 py-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`size-3 rounded-full shrink-0 ${colors[idx % colors.length]}`} />
                        <span className="text-xs font-medium text-white truncate">{prod.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{prod.cantidad} unid.</span>
                        <span className="text-xs font-bold text-[#ff751f]">{formatPrice(prod.monto)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

function MetricCard({ title, value, icon, color, isNumber = false }: any) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ring-[#333] ${color}`}>
      <div className="mb-2 flex items-center gap-2 opacity-80">{icon}<span className="text-xs font-semibold">{title}</span></div>
      <div className="text-2xl font-extrabold">{isNumber ? value : formatPrice(value)}</div>
    </div>
  )
}

function TypeLegend({ icon, label, value, total, color }: any) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  if (value === 0) return null // No mostrar tipos con 0 pedidos
  
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-gray-300">
        <div className={`size-2 rounded-full ${color}`} />
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{percentage}%</span>
        <span className="font-bold text-white">{value}</span>
      </div>
    </div>
  )
}

// ==========================================
// GRÁFICO DE TORTA SVG
// ==========================================

type PieSlice = {
  label: string
  value: number
  color: string
}

function PieChart({ data, size }: { data: PieSlice[]; size: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return null
  
  const radius = size / 2
  const center = radius
  let currentAngle = -90 // Empezar desde arriba
  
  const slices = data
    .filter(item => item.value > 0)
    .map((item) => {
      const angle = (item.value / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle
      
      // Calcular path del slice
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180
      
      const x1 = center + radius * Math.cos(startRad)
      const y1 = center + radius * Math.sin(startRad)
      const x2 = center + radius * Math.cos(endRad)
      const y2 = center + radius * Math.sin(endRad)
      
      const largeArc = angle > 180 ? 1 : 0
      
      const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
      
      return {
        path,
        color: item.color,
        percentage: Math.round((item.value / total) * 100)
      }
    })
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, idx) => (
        <path
          key={idx}
          d={slice.path}
          fill={slice.color}
          stroke="#0a0a0a"
          strokeWidth="2"
          className="transition-all duration-500"
        />
      ))}
    </svg>
  )
}

// ==========================================
// HELPERS PARA PREPARAR DATOS DE LAS TORTAS
// ==========================================

function tipoData(porTipo: any): PieSlice[] {
  return [
    { label: "Delivery", value: porTipo.delivery || 0, color: "#f97316" },
    { label: "Retiro", value: porTipo.retiro || 0, color: "#3b82f6" },
    { label: "Doblefila", value: porTipo.doblefila || 0, color: "#22c55e" },
    { label: "Mesa", value: porTipo.mesa || 0, color: "#a855f7" },
    { label: "Mostrador", value: porTipo.mostrador || 0, color: "#ec4899" },
  ]
}

function productosData(productos: Array<{ name: string; monto: number }>): PieSlice[] {
  const colors = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#eab308", "#06b6d4", "#f43f5e"]
  return productos.slice(0, 8).map((prod, idx) => ({
    label: prod.name,
    value: prod.monto,
    color: colors[idx % colors.length]
  }))
}