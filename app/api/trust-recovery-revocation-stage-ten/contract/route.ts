import { NextResponse } from "next/server";
import { contractResponse, requireTrustRecoveryRevocationStageTenUser } from "../core";

export async function GET() { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(contractResponse()); }
