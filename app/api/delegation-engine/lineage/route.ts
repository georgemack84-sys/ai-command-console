import { NextResponse } from "next/server";
import { lineageRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await lineageRequest(request)); }
