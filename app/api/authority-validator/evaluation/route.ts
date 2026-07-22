import { NextResponse } from "next/server";
import { evaluationRequest, requireAuthorityValidatorUser } from "../core";

export async function GET() { await requireAuthorityValidatorUser(); return NextResponse.json(await evaluationRequest()); }
export async function POST(request: Request) { await requireAuthorityValidatorUser(); return NextResponse.json(await evaluationRequest(request)); }
