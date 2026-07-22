import { NextResponse } from "next/server";
import { arbitrationRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await arbitrationRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await arbitrationRequest(request)); }
