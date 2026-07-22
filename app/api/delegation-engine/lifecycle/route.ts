import { NextResponse } from "next/server";
import { lifecycleRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await lifecycleRequest(request)); }
