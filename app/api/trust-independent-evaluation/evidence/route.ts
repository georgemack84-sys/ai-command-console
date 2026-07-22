import { NextResponse } from "next/server";
import { evidenceRequest, requireTrustIndependentEvaluationUser } from "../core";

export async function GET() { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await evidenceRequest(request)); }
