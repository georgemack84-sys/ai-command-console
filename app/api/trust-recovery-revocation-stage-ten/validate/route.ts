import { NextResponse } from "next/server";
import { requireTrustRecoveryRevocationStageTenUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustRecoveryRevocationStageTenUser(); return NextResponse.json(await validateRequest(request)); }
