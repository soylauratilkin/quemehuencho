"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, ShoppingCart, DollarSign, Package, Bike, Store, Car, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/menu-data"

type DashboardData = {
  totalHoy: number
  totalSemana: number
  totalMes: number
  pedidosHoy: number
  pedidosSemana: number
  pedidosMes: number
  promedioDiario: number
  ticketPromedio: number
  porTipo: {
    delivery: number
    retiro: number
    doblefila: number
    mesa: number
  }
  productosMasVendidos: Array<{ name: string; quantity: number }>
}

// ✅ VALORES POR DEFECTO PARA EVITAR UNDEFINED
const DEFAULT_DATA: DashboardData = {
  totalHoy: 0,
  totalSemana: 0,
  totalMes: 0,
  pedidosHoy: 0,
  pedidosSemana: 0,
  pedidosMes: 0,
  promedioDiario: 0,
  ticketPromedio: 0,
  porTipo: { delivery: 0, retiro: 0, doblefila: 0, mesa: 0 },
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
      
      // ✅ Fusionamos con DEFAULT_DATA para garantizar que NADA sea undefined
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

  // Cálculo real del total de pedidos para las barras de progreso
  const totalPedidosTipo = 
    (data.porTipo.delivery || 0) + 
    (data.porTipo.retiro || 0) + 
    (data.porTipo.doblefila || 0) + 
    (data.porTipo.mesa || 0)

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
            title="Por Día"
            value={data.pedidosHoy > 0 ? Math.round((data.totalHoy || 0) / data.pedidosHoy) : 0}
            icon={<Package className="size-5" />}
            color="bg-yellow-500/20 text-yellow-400"
          />
        </div>

        {/* PEDIDOS POR TIPO */}
        <div className="rounded-3xl bg-[#111] p-5 ring-1 ring-[#333]">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">Pedidos por Tipo</h3>
          <div className="space-y-3">
            <TypeRow icon={<Bike className="size-4" />} label="Delivery" value={data.porTipo.delivery || 0} total={totalPedidosTipo} color="bg-orange-500" />
            <TypeRow icon={<Store className="size-4" />} label="Retiro" value={data.porTipo.retiro || 0} total={totalPedidosTipo} color="bg-blue-500" />
            <TypeRow icon={<Car className="size-4" />} label="Doblefila Express" value={data.porTipo.doblefila || 0} total={totalPedidosTipo} color="bg-green-500" />
            <TypeRow icon={<Users className="size-4" />} label="Mesa" value={data.porTipo.mesa || 0} total={totalPedidosTipo} color="bg-purple-500" />
          </div>
        </div>

        {/* PRODUCTOS MÁS VENDIDOS */}
        {data.productosMasVendidos.length > 0 && (
          <div className="rounded-3xl bg-[#111] p-5 ring-1 ring-[#333]">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">🔥 Más Vendidos</h3>
            <div className="space-y-2">
              {data.productosMasVendidos.slice(0, 5).map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-[#1a1a1a] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-6 items-center justify-center rounded-full bg-[#ff751f] text-xs font-bold text-black">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-white">{prod.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#ff751f]">{prod.quantity} unid.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componentes auxiliares
function MetricCard({ title, value, icon, color, isNumber = false }: any) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ring-[#333] ${color}`}>
      <div className="mb-2 flex items-center gap-2 opacity-80">{icon}<span className="text-xs font-semibold">{title}</span></div>
      <div className="text-2xl font-extrabold">{isNumber ? value : formatPrice(value)}</div>
    </div>
  )
}

function TypeRow({ icon, label, value, color, total }: any) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-gray-300">{icon}<span>{label}</span></div>
        <span className="font-bold text-white">{value} pedidos</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}