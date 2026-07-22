import { NextResponse } from "next/server";
import { requireMemoryEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await validateRequest(request)); }
