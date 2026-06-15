import { NextRequest, NextResponse } from "next/server";

// Coordenadas aproximadas de Roque Sáenz Peña 212, Puerto Madryn
const ORIGEN_LAT = -42.7698;
const ORIGEN_LNG = -65.0383;

// Límite máximo de distancia (10km)
const MAX_DISTANCIA_KM = 10;

function calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
    // Buscar con más contexto específico de Puerto Madryn
    const busquedas = [
      `${destino}, Puerto Madryn, Chubut, Argentina`,
      `${destino}, Puerto Madryn, Argentina`,
      destino
    ];

    let geoData = null;
    let busquedaExitosa = "";

    for (const busqueda of busquedas) {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        busqueda
      )}&limit=1&countrycodes=ar&viewbox=-65.2,-42.9,-64.8,-42.6&bounded=0`;

      const geoResponse = await fetch(geocodeUrl, {
        headers: {
          "User-Agent": "QuemehuenchoApp/1.0 (soylauratilkin@gmail.com)",
        },
      });

      const data = await geoResponse.json();
      
      if (data && data.length > 0) {
        // Verificar que esté en Puerto Madryn (dentro de un rango razonable)
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        // Puerto Madryn está aproximadamente entre lat -42.7 y -42.8, lng -65.0 y -65.1
        if (lat > -43.0 && lat < -42.5 && lon > -65.3 && lon < -64.7) {
          geoData = data;
          busquedaExitosa = busqueda;
          break;
        }
      }
    }

    if (!geoData || geoData.length === 0) {
      return NextResponse.json(
        { 
          error: "No pudimos encontrar esa dirección en Puerto Madryn. Intentá ser más específico (ej: 'Gales 2233, Puerto Madryn')." 
        },
        { status: 404 }
      );
    }

    const destLat = parseFloat(geoData[0].lat);
    const destLng = parseFloat(geoData[0].lon);
    const direccionEncontrada = geoData[0].display_name;

    // Calcular distancia en línea recta
    const distanciaLineaRecta = calcularDistanciaHaversine(ORIGEN_LAT, ORIGEN_LNG, destLat, destLng);

    // Aplicar factor de 1.2 para aproximar la distancia real de manejo
    const distanciaManejo = distanciaLineaRecta * 1.2;

    if (distanciaManejo > MAX_DISTANCIA_KM) {
      return NextResponse.json(
        { 
          error: `La dirección está a ${distanciaManejo.toFixed(1)} km, fuera de nuestra zona de delivery (máximo ${MAX_DISTANCIA_KM} km).`,
          direccionEncontrada
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      distancia: distanciaManejo,
      direccionEncontrada 
    });

  } catch (error) {
    console.error("Error en cálculo de distancia:", error);
    return NextResponse.json(
      { error: "Error al calcular la distancia. Intentá de nuevo." },
      { status: 500 }
    );
  }
}