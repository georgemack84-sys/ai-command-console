import { NextResponse } from "next/server";
import { requireCollaborationEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireCollaborationEngineUser(); return NextResponse.json(await validateRequest(request)); }
