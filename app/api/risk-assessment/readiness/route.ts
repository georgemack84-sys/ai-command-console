import { NextResponse } from "next/server";
import { readinessRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await readinessRequest(request)); }
