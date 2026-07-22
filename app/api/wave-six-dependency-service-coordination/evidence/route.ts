import { NextResponse } from "next/server";
import { evidenceRequest, requireWaveSixDependencyServiceCoordinationUser } from "../core";

export async function GET() { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await evidenceRequest(request)); }
