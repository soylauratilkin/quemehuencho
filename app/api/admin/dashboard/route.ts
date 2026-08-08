import { NextResponse } from "next/server"

const SCRIPT_URL = process.env.APPS_SCRIPT_URL || ""

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get("periodo") || "mes"
    
    const res = await fetch(`${SCRIPT_URL}?action=getDashboard&periodo=${periodo}`, {
      cache: "no-store"
    })
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error("Error fetching dashboard:", e)
    return NextResponse.json({
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
    }, { status: 500 })
  }
}