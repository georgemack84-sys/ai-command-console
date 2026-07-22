import { NextResponse } from "next/server";
import { frameworkRequest, requireResilienceRecoveryUser } from "../core";
export async function GET() { await requireResilienceRecoveryUser(); return NextResponse.json(await frameworkRequest()); }
export async function POST(request: Request) { await requireResilienceRecoveryUser(); return NextResponse.json(await frameworkRequest(request)); }
