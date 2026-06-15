import { NextRequest, NextResponse } from "next/server";

// Coordenadas aproximadas de Roque Sáenz Peña 212, Puerto Madryn
const ORIGEN_LAT = -42.7698;
const ORIGEN_LNG = -65.0383;

// Fórmula de Haversine para calcular distancia en línea recta entre dos puntos
function calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const destino = searchParams.get("destino");

  if (!destino) {
    return NextResponse.json({ error: "Falta el parámetro destino" }, { status: 400 });
  }

  try {
    // 1. Geocodificar la dirección del cliente usando OpenStreetMap (Gratis)
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      destino + ", Puerto Madryn, Chubut, Argentina"
    )}&limit=1`;

    const geoResponse = await fetch(geocodeUrl, {
      headers: {
        "User-Agent": "QuemehuenchoApp/1.0 (soylauratilkin@gmail.com)",
      },
    });

    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      return NextResponse.json(
        { error: "No pudimos encontrar esa dirección. Intentá ser más específico (ej: 'Calle Falsa 123')." },
        { status: 404 }
      );
    }

    const destLat = parseFloat(geoData[0].lat);
    const destLng = parseFloat(geoData[0].lon);

    // 2. Calcular distancia en línea recta
    const distanciaLineaRecta = calcularDistanciaHaversine(ORIGEN_LAT, ORIGEN_LNG, destLat, destLng);

    // 3. Aplicar factor de 1.2 para aproximar la distancia real de manejo (rutas, vueltas, etc.)
    const distanciaManejo = distanciaLineaRecta * 1.2;

    return NextResponse.json({ distancia: distanciaManejo });

  } catch (error) {
    console.error("Error en cálculo de distancia:", error);
    return NextResponse.json(
      { error: "Error al calcular la distancia. Intentá de nuevo." },
      { status: 500 }
    );
  }
}