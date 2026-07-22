import { NextResponse } from "next/server";
import { explainabilityRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await explainabilityRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await explainabilityRequest(request)); }
