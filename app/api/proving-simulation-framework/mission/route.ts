import { NextResponse } from "next/server";
import { missionRequest, requireSimulationFrameworkUser } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await missionRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await missionRequest(request)); }
