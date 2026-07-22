import { NextResponse } from "next/server";
import { evaluationRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await evaluationRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await evaluationRequest(request)); }
