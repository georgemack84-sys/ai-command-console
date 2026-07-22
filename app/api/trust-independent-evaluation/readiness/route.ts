import { NextResponse } from "next/server";
import { readinessRequest, requireTrustIndependentEvaluationUser } from "../core";

export async function GET() { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await readinessRequest(request)); }
