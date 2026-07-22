import { NextResponse } from "next/server";
import { requireReplayEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await validateRequest(request)); }
