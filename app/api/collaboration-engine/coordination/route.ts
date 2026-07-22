import { NextResponse } from "next/server";
import { coordinationRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await coordinationRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await coordinationRequest(request)); }
