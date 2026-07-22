import { NextResponse } from "next/server";
import { requireTrustRecoveryRevocationStageTenUser, revocationRequest } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await revocationRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await revocationRequest(request)); }
