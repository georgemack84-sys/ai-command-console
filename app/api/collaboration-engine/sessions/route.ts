import { NextResponse } from "next/server";
import { requireCollaborationEngineUser, sessionsRequest } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await sessionsRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await sessionsRequest(request)); }
