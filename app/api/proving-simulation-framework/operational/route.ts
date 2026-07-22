import { NextResponse } from "next/server";
import { operationalRequest, requireSimulationFrameworkUser } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await operationalRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await operationalRequest(request)); }
