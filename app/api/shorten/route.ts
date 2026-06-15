import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzaKEUKzMuCSNiuzcvBFCtebPXgrpqyugjZTzTgpp_ZCuG5hWrd79FZOoK5ODccyvVhQ/exec";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Falta URL", shortUrl: "" });
  }

  try {
    // Llamar a Apps Script para acortar
    const response = await fetch(`${APPS_SCRIPT_URL}?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (data.success && data.shortUrl) {
      return NextResponse.json({ shortUrl: data.shortUrl });
    }

    return NextResponse.json({ shortUrl: url });
  } catch (error) {
    console.error("Error acortando URL:", error);
    return NextResponse.json({ shortUrl: url });
  }
}