import { NextResponse } from "next/server";
import { evidenceRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await evidenceRequest(request)); }
