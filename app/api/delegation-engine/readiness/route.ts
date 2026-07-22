import { NextResponse } from "next/server";
import { readinessRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await readinessRequest(request)); }
