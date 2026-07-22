import { NextResponse } from "next/server";
import { contractResponse, requireTrustIndependentEvaluationUser } from "../core";

export async function GET() { await requireTrustIndependentEvaluationUser(); return NextResponse.json(contractResponse()); }
