import { NextResponse } from "next/server";
import { contractResponse, requireRuntimeOrchestratorUser } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(contractResponse()); }
