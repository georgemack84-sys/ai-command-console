import { NextResponse } from "next/server";
import { expirationRequest, requireTrustRecoveryRevocationStageTenUser } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await expirationRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await expirationRequest(request)); }
