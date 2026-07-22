import { NextResponse } from "next/server";
import { evidenceTelemetryRequest, requireWaveFiveApplicationPlatformUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await evidenceTelemetryRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await evidenceTelemetryRequest(request)); }
