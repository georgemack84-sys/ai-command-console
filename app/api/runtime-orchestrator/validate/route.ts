import { NextResponse } from "next/server";
import { requireRuntimeOrchestratorUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await validateRequest(request)); }
