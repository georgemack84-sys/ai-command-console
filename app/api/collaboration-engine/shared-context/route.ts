import { NextResponse } from "next/server";
import { requireCollaborationEngineUser, sharedContextRequest } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await sharedContextRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await sharedContextRequest(request)); }
