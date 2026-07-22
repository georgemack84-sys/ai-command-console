import { NextResponse } from "next/server";
import { metricsRequest, requireSimulationFrameworkUser } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await metricsRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await metricsRequest(request)); }
