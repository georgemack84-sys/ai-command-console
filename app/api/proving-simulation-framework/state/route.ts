import { NextResponse } from "next/server";
import { requireSimulationFrameworkUser, stateRequest } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await stateRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await stateRequest(request)); }
