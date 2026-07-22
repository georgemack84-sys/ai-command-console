import { NextResponse } from "next/server";
import { authorityIntersectionRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await authorityIntersectionRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await authorityIntersectionRequest(request)); }
