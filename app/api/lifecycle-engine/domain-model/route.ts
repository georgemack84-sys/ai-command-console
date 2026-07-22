import { NextResponse } from "next/server";
import { domainModelRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await domainModelRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await domainModelRequest(request)); }
