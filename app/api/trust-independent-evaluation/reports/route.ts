import { NextResponse } from "next/server";
import { reportsRequest, requireTrustIndependentEvaluationUser } from "../core";

export async function GET() { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await reportsRequest(request)); }
