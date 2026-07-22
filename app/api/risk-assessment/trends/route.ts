import { NextResponse } from "next/server";
import { requireRiskAssessmentUser, trendsRequest } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await trendsRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await trendsRequest(request)); }
