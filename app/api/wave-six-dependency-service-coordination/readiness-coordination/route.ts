import { NextResponse } from "next/server";
import { readinessCoordinationRequest, requireWaveSixDependencyServiceCoordinationUser } from "../core";

export async function GET() { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await readinessCoordinationRequest()); }
export async function POST(request: Request) { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await readinessCoordinationRequest(request)); }
