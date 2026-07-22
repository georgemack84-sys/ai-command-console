import { NextResponse } from "next/server";
import { failureInjectionRequest, requireResilienceRecoveryUser } from "../core";
export async function GET() { await requireResilienceRecoveryUser(); return NextResponse.json(await failureInjectionRequest()); }
export async function POST(request: Request) { await requireResilienceRecoveryUser(); return NextResponse.json(await failureInjectionRequest(request)); }
