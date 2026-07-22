import { NextResponse } from "next/server";
import { consensusRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await consensusRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await consensusRequest(request)); }
