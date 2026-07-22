import { NextResponse } from "next/server";
import { lifecycleRequest, requireTrustCertificationStageElevenUser } from "../core";

export async function GET() { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await lifecycleRequest(request)); }
