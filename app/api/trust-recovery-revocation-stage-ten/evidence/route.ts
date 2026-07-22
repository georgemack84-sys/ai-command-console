import { NextResponse } from "next/server";
import { evidenceRequest, requireTrustRecoveryRevocationStageTenUser } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await evidenceRequest(request)); }
