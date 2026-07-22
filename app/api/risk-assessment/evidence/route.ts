import { NextResponse } from "next/server";
import { evidenceRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await evidenceRequest(request)); }
