import { NextResponse } from "next/server";
import { confidenceRequest, requireTrustIndependentEvaluationUser } from "../core";

export async function GET() { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await confidenceRequest()); }
export async function POST(request: Request) { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await confidenceRequest(request)); }
