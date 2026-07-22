import { NextResponse } from "next/server";
import { requireWaveSixOperationalMonitoringReactionUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await validateRequest(request)); }
