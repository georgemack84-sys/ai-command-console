import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixDependencyServiceCoordinationUser } from "../core";

export async function GET() { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(contractResponse()); }
