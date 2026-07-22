import { NextResponse } from "next/server";
import { bottleneckDetectionRequest, requireWaveSixOperationalOptimizationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await bottleneckDetectionRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await bottleneckDetectionRequest(request)); }
