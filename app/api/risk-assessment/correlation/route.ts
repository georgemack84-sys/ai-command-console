import { NextResponse } from "next/server";
import { correlationRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await correlationRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await correlationRequest(request)); }
