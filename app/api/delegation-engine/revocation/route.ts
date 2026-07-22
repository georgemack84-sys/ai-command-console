import { NextResponse } from "next/server";
import { requireDelegationEngineUser, revocationRequest } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await revocationRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await revocationRequest(request)); }
