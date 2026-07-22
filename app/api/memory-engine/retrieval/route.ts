import { NextResponse } from "next/server";
import { requireMemoryEngineUser, retrievalRequest } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await retrievalRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await retrievalRequest(request)); }
