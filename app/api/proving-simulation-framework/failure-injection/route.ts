import { NextResponse } from "next/server";
import { failureInjectionRequest, requireSimulationFrameworkUser } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await failureInjectionRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await failureInjectionRequest(request)); }
