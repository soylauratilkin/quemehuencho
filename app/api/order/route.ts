import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzaKEUKzMuCSNiuzcvBFCtebPXgrpqyugjZTzTgpp_ZCuG5hWrd79FZOoK5ODccyvVhQ/exec";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Reenviar a Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { 
        // "text/plain" evita problemas de CORS preflight con Google Apps Script
        "Content-Type": "text/plain;charset=utf-8", 
      },
      body: JSON.stringify(data),
    });
    
    // Leemos como texto primero, porque GAS a veces no devuelve JSON válido
    const responseText = await response.text();
    
    let result;
    try {
      // Intentamos parsear como JSON
      result = JSON.parse(responseText);
    } catch (e) {
      console.warn("⚠️ GAS no devolvió JSON válido, pero el pedido podría haberse guardado.");
      console.warn("Respuesta cruda de GAS:", responseText);
      
      // Si el status es 200 (OK), asumimos que se guardó, aunque el formato sea raro
      if (response.ok) {
        result = { success: true, message: "Pedido guardado correctamente" };
      } else {
        throw new Error("La respuesta de GAS no fue exitosa");
      }
    }
    
    return NextResponse.json(result, { status: response.ok ? 200 : 500 });
    
  } catch (error) {
    console.error("❌ Error en proxy de pedido:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar el pedido" },
      { status: 500 }
    );
  }
}