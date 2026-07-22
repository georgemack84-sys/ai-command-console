import { NextResponse } from "next/server";
import { requireTrustIndependentEvaluationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustIndependentEvaluationUser(); return NextResponse.json(await validateRequest(request)); }
