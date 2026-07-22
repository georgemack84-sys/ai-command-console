import { NextResponse } from "next/server";
import { prioritizationRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await prioritizationRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await prioritizationRequest(request)); }
