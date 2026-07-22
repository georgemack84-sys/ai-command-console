import { NextResponse } from "next/server";
import { evidenceReportsRequest, requireWaveSixOperationalOptimizationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await evidenceReportsRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await evidenceReportsRequest(request)); }
