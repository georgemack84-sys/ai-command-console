import { NextResponse } from "next/server";
import { performanceMeasurementRequest, requireWaveFiveApexUser } from "../core";

export async function GET() { await requireWaveFiveApexUser(); return NextResponse.json(await performanceMeasurementRequest()); }
export async function POST(request: Request) { await requireWaveFiveApexUser(); return NextResponse.json(await performanceMeasurementRequest(request)); }
