import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixOperationalMonitoringReactionUser } from "../core";

export async function GET() { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(contractResponse()); }
