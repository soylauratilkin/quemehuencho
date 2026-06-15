import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Falta URL" }, { status: 400 });
  }

  try {
    // Intentar con is.gd
    const response = await fetch(
      `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`
    );
    const data = await response.json();
    
    if (data.shorturl) {
      return NextResponse.json({ shortUrl: data.shorturl });
    }
    
    // Fallback a tinyurl
    const response2 = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    const shortUrl2 = await response2.text();
    
    if (shortUrl2.startsWith("http")) {
      return NextResponse.json({ shortUrl: shortUrl2.trim() });
    }
    
    return NextResponse.json({ shortUrl: url });
  } catch (error) {
    console.error("Error acortando URL:", error);
    return NextResponse.json({ shortUrl: url });
  }
}