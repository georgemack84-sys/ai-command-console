import { NextResponse } from "next/server";
import { reportsRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await reportsRequest(request)); }
