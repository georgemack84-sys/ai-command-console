import { NextResponse } from "next/server";
import { apisEvidenceRequest, requireWaveFiveFinanceUser } from "../core";

export async function GET() { await requireWaveFiveFinanceUser(); return NextResponse.json(await apisEvidenceRequest()); }
export async function POST(request: Request) { await requireWaveFiveFinanceUser(); return NextResponse.json(await apisEvidenceRequest(request)); }
