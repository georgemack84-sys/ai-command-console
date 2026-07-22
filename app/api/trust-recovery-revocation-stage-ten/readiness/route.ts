import { NextResponse } from "next/server";
import { readinessRequest, requireTrustRecoveryRevocationStageTenUser } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await readinessRequest(request)); }
