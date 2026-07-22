import { NextResponse } from "next/server";
import { reportsRequest, requireTrustCertificationStageElevenUser } from "../core";

export async function GET() { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await reportsRequest(request)); }
