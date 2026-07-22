import { NextResponse } from "next/server";
import { requireTrustCertificationStageElevenUser, rulesRequest } from "../core";

export async function GET() { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await rulesRequest()); }
export async function POST(request: Request) { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await rulesRequest(request)); }
