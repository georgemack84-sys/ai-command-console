import { NextResponse } from "next/server";
import { failoverRequest, requireResilienceRecoveryUser } from "../core";
export async function GET() { await requireResilienceRecoveryUser(); return NextResponse.json(await failoverRequest()); }
export async function POST(request: Request) { await requireResilienceRecoveryUser(); return NextResponse.json(await failoverRequest(request)); }
