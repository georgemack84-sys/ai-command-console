import { NextResponse } from "next/server";
import { disasterRecoveryRequest, requireResilienceRecoveryUser } from "../core";
export async function GET() { await requireResilienceRecoveryUser(); return NextResponse.json(await disasterRecoveryRequest()); }
export async function POST(request: Request) { await requireResilienceRecoveryUser(); return NextResponse.json(await disasterRecoveryRequest(request)); }
