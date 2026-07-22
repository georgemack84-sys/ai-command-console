import { NextResponse } from "next/server";
import { requireTrustCertificationStageElevenUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await validateRequest(request)); }
