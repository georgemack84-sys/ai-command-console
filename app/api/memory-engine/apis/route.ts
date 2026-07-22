import { NextResponse } from "next/server";
import { apisRequest, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await apisRequest(request)); }
