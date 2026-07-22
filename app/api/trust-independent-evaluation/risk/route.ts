import { NextResponse } from "next/server";
import { requireTrustIndependentEvaluationUser, riskRequest } from "../core";

export async function GET() { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await riskRequest()); }
export async function POST(request: Request) { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await riskRequest(request)); }
