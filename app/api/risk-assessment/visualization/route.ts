import { NextResponse } from "next/server";
import { requireRiskAssessmentUser, visualizationRequest } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await visualizationRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await visualizationRequest(request)); }
