import { NextResponse } from "next/server";
import { monitoringRequest, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(await monitoringRequest()); }
export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await monitoringRequest(request)); }
