import { NextRequest, NextResponse } from "next/server";
import { getWeatherForecast } from "../../../lib/weather/weather-server";

function numberParam(request: NextRequest, name: string, minimum: number, maximum: number): number | null {
  const parsed = Number(request.nextUrl.searchParams.get(name));
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

export async function GET(request: NextRequest) {
  const latitude = numberParam(request, "latitude", -90, 90);
  const longitude = numberParam(request, "longitude", -180, 180);
  const timezone = request.nextUrl.searchParams.get("timezone")?.trim() || "UTC";
  const locationLabel = request.nextUrl.searchParams.get("label")?.trim() || "Selected location";
  const source = request.nextUrl.searchParams.get("source") === "CURRENT_DEVICE" ? "CURRENT_DEVICE" : "HOUSEHOLD";
  if (latitude === null || longitude === null || timezone.length > 100 || locationLabel.length > 100) {
    return NextResponse.json({ error: "A valid location is required." }, { status: 400 });
  }

  try { return NextResponse.json(await getWeatherForecast({ latitude, longitude, timezone, label: locationLabel, source }), { headers: { "Cache-Control": "private, max-age=900" } }); }
  catch { return NextResponse.json({ error: "Weather is temporarily unavailable." }, { status: 502 }); }
}
