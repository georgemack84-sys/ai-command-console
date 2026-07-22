import { NextResponse } from "next/server";
import { contractResponse, requireRiskAssessmentUser } from "../core";

export async function GET() { await requireRiskAssessmentUser(); return NextResponse.json(contractResponse()); }
