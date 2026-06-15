import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzaKEUKzMuCSNiuzcvBFCtebPXgrpqyugjZTzTgpp_ZCuG5hWrd79FZOoK5ODccyvVhQ/exec";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const destino = searchParams.get("destino");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!destino && (!lat || !lng)) {
    return NextResponse.json({ error: "Falta dirección o coordenadas" }, { status: 400 });
  }

  try {
    let url = APPS_SCRIPT_URL;
    
    if (lat && lng) {
      url += `?lat=${lat}&lng=${lng}`;
    } else {
      url += `?destino=${encodeURIComponent(destino || "")}`;
    }
    
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