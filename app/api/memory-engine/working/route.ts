import { NextResponse } from "next/server";
import { requireMemoryEngineUser, workingRequest } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await workingRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await workingRequest(request)); }
