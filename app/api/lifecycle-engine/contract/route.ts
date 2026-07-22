import { NextResponse } from "next/server";
import { contractResponse, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(contractResponse()); }
