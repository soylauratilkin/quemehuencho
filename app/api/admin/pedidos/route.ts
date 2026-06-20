import { NextResponse } from "next/server"

const SCRIPT_URL = process.env.APPS_SCRIPT_URL || ""

export async function GET() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getPedidosActivos`, {
      cache: "no-store"
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error("Error GET:", e)
    return NextResponse.json({ pedidos: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Si tiene action "nuevoPedidoLocal", es un pedido del admin
    if (body.action === "nuevoPedidoLocal") {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminAction: true,
          action: "nuevoPedidoLocal",
          id: body.id,
          origen: body.origen,
          ubicacion: body.ubicacion,
          total: body.total,
          detalle: body.detalle,
          items: body.items
        })
      })
      const data = await res.json()
      return NextResponse.json(data)
    }
    
    // Si tiene action "entregado" o "pagado", es marcar estado
    if (body.action === "entregado" || body.action === "pagado") {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminAction: true,
          action: body.action,
          id: body.id
        })
      })
      const data = await res.json()
      return NextResponse.json(data)
    }
    
    return NextResponse.json({ success: false, error: "Action no válida" }, { status: 400 })
  } catch (e) {
    console.error("Error POST:", e)
    return NextResponse.json({ success: false, error: "Error de conexión" }, { status: 500 })
  }
}