import { NextResponse } from "next/server";
import { requireWaveSixOperationalOrchestrationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await validateRequest(request)); }
