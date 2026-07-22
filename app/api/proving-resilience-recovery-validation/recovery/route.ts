import { NextResponse } from "next/server";
import { recoveryRequest, requireResilienceRecoveryUser } from "../core";
export async function GET() { await requireResilienceRecoveryUser(); return NextResponse.json(await recoveryRequest()); }
export async function POST(request: Request) { await requireResilienceRecoveryUser(); return NextResponse.json(await recoveryRequest(request)); }
