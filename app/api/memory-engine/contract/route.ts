import { NextResponse } from "next/server";
import { contractResponse, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(contractResponse()); }
