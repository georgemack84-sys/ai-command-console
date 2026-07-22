import { NextResponse } from "next/server";
import { registryRequest, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await registryRequest(request)); }
