import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const DIRECCION_LOCAL = "Roque Sáenz Peña 212, Puerto Madryn, Argentina";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const destino = searchParams.get("destino");

  if (!destino) {
    return NextResponse.json(
      { error: "Falta el parámetro destino" },
      { status: 400 }
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "API Key de Google Maps no configurada" },
      { status: 500 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${encodeURIComponent(DIRECCION_LOCAL)}&` +
      `destinations=${encodeURIComponent(destino + ", Puerto Madryn, Argentina")}&` +
      `mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.rows && data.rows[0] && data.rows[0].elements[0].status === "OK") {
      const distanciaMetros = data.rows[0].elements[0].distance.value;
      const distanciaKm = distanciaMetros / 1000;
      return NextResponse.json({ distancia: distanciaKm });
    } else {
      return NextResponse.json(
        { error: "No se pudo calcular la distancia", details: data },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error al contactar Google Maps" },
      { status: 500 }
    );
  }
}