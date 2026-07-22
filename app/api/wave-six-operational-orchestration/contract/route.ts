import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixOperationalOrchestrationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(contractResponse()); }
