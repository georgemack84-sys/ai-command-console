import { NextResponse } from "next/server";
import { forecastRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await forecastRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await forecastRequest(request)); }
