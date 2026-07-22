import { NextResponse } from "next/server";
import { recoveryEvaluationRequest, requireTrustRecoveryRevocationStageTenUser } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await recoveryEvaluationRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await recoveryEvaluationRequest(request)); }
