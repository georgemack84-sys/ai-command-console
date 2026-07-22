import { NextResponse } from "next/server";
import { contractResponse, requireCollaborationEngineUser } from "../core";

export async function GET() { await requireCollaborationEngineUser(); return NextResponse.json(contractResponse()); }
