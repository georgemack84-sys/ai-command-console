import { NextResponse } from "next/server";
import { couplingRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await couplingRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await couplingRequest(request)); }
