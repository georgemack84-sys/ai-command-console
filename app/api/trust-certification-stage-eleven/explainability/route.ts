import { NextResponse } from "next/server";
import { explainabilityRequest, requireTrustCertificationStageElevenUser } from "../core";

export async function GET() { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await explainabilityRequest()); }
export async function POST(request: Request) { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await explainabilityRequest(request)); }
