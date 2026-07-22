import { NextResponse } from "next/server";
import { registryRequest, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await registryRequest(request)); }
