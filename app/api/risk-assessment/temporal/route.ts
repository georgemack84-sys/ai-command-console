import { NextResponse } from "next/server";
import { requireRiskAssessmentUser, temporalRequest } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await temporalRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await temporalRequest(request)); }
