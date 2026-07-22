import { NextResponse } from "next/server";
import { apisRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await apisRequest(request)); }
