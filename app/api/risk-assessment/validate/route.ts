import { NextResponse } from "next/server";
import { requireRiskAssessmentUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireRiskAssessmentUser(); return NextResponse.json(await validateRequest(request)); }
