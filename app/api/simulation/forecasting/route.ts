import { NextResponse } from "next/server";
import { forecastingRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await forecastingRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await forecastingRequest(request)); }
