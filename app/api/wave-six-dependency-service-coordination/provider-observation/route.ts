import { NextResponse } from "next/server";
import { providerObservationRequest, requireWaveSixDependencyServiceCoordinationUser } from "../core";

export async function GET() { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await providerObservationRequest()); }
export async function POST(request: Request) { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await providerObservationRequest(request)); }
