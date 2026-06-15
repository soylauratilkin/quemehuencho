import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzaKEUKzMuCSNiuzcvBFCtebPXgrpqyugjZTzTgpp_ZCuG5hWrd79FZOoK5ODccyvVhQ/exec";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const destino = searchParams.get("destino");

  if (!destino) {
    return NextResponse.json({ error: "Falta el parámetro destino" }, { status: 400 });
  }

  try {
    // Llamar al Apps Script que usa el Google Maps real
    const url = `${APPS_SCRIPT_URL}?destino=${encodeURIComponent(destino)}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "No se pudo calcular la distancia" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      distancia: data.distancia,
      direccionEncontrada: data.direccionEncontrada,
      urlViaje: data.urlViaje
    });

  } catch (error) {
    console.error("Error calculando distancia:", error);
    return NextResponse.json(
      { error: "Error al contactar el servicio de cálculo" },
      { status: 500 }
    );
  }
}