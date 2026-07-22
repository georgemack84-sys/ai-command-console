import { NextResponse } from "next/server";
import { readinessRequest, requireWaveSixOperationalOptimizationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await readinessRequest(request)); }
