import { NextResponse } from "next/server";
import { contractsRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await contractsRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await contractsRequest(request)); }
