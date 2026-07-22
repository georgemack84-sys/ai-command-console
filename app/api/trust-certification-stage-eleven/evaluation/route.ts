import { NextResponse } from "next/server";
import { evaluationRequest, requireTrustCertificationStageElevenUser } from "../core";

export async function GET() { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await evaluationRequest()); }
export async function POST(request: Request) { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await evaluationRequest(request)); }
