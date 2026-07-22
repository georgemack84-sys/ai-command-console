import { NextResponse } from "next/server";
import { evidenceRequest, requireResilienceRecoveryUser } from "../core";
export async function GET() { await requireResilienceRecoveryUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireResilienceRecoveryUser(); return NextResponse.json(await evidenceRequest(request)); }
