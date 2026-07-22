import { NextResponse } from "next/server";
import { governanceRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await governanceRequest(request)); }
