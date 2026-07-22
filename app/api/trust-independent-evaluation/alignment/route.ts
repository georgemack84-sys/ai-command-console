import { NextResponse } from "next/server";
import { alignmentRequest, requireTrustIndependentEvaluationUser } from "../core";

export async function GET() { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await alignmentRequest()); }
export async function POST(request: Request) { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await alignmentRequest(request)); }
