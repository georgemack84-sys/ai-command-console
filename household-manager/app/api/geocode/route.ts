import { NextRequest, NextResponse } from "next/server";

type GeocodingResult = { latitude: number; longitude: number; timezone?: string };

function value(request: NextRequest, name: string): string {
  return request.nextUrl.searchParams.get(name)?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  const city = value(request, "city");
  const state = value(request, "state");
  const postalCode = value(request, "postalCode");
  const country = value(request, "country");
  if (!city || !state || !country || [city, state, postalCode, country].some((part) => part.length > 100)) {
    return NextResponse.json({ error: "City, state/region, and country are required." }, { status: 400 });
  }

  const query = [city, state, postalCode, country].filter(Boolean).join(", ");
  const providerResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`, {
    next: { revalidate: 2_592_000 }
  });
  if (!providerResponse.ok) return NextResponse.json({ error: "Location search is temporarily unavailable." }, { status: 502 });
  const providerData = (await providerResponse.json()) as { results?: GeocodingResult[] };
  const place = providerData.results?.[0];
  if (!place) return NextResponse.json({ error: "We could not find that location." }, { status: 404 });
  return NextResponse.json({ latitude: place.latitude, longitude: place.longitude, timezone: place.timezone ?? "UTC" });
}
