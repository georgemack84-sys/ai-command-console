import { NextResponse } from "next/server";
import { apisRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await apisRequest(request)); }
