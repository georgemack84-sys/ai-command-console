import { NextResponse } from "next/server";
import { conflictsRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await conflictsRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await conflictsRequest(request)); }
