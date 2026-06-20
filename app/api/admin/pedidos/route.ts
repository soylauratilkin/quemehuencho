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
    
    // Reenviar TODO al Apps Script con adminAction: true
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminAction: true,
        ...body
      })
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error("Error POST:", e)
    return NextResponse.json({ success: false, error: "Error de conexión" }, { status: 500 })
  }
}