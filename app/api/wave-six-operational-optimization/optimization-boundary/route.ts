import { NextResponse } from "next/server";
import { optimizationBoundaryRequest, requireWaveSixOperationalOptimizationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await optimizationBoundaryRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await optimizationBoundaryRequest(request)); }
