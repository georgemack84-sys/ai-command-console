import { NextResponse } from "next/server";
import { requireTrustRecoveryRevocationStageTenUser, suspensionRequest } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await suspensionRequest()); }
export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await suspensionRequest(request)); }
