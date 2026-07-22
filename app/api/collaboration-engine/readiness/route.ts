import { NextResponse } from "next/server";
import { readinessRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await readinessRequest(request)); }
