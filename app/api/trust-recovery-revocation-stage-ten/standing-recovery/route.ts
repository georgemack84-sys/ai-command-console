import { NextResponse } from "next/server";
import { requireTrustRecoveryRevocationStageTenUser, standingRecoveryRequest } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await standingRecoveryRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await standingRecoveryRequest(request)); }
