import { NextResponse } from "next/server";
import { engineRequest, requireSimulationFrameworkUser } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await engineRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await engineRequest(request)); }
