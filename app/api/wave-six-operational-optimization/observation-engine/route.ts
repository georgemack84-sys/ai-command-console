import { NextResponse } from "next/server";
import { observationEngineRequest, requireWaveSixOperationalOptimizationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await observationEngineRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await observationEngineRequest(request)); }
