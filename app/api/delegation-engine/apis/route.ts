import { NextResponse } from "next/server";
import { apisRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await apisRequest(request)); }
