import { NextResponse } from "next/server";
import { readinessRequest, requireWaveSixDependencyServiceCoordinationUser } from "../core";

export async function GET() { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await readinessRequest(request)); }
