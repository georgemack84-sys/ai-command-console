import { NextResponse } from "next/server";
import { governanceRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await governanceRequest(request)); }
