import { NextResponse } from "next/server";
import { requireTrustRecoveryRevocationStageTenUser, standingRequest } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await standingRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await standingRequest(request)); }
