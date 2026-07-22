import { NextResponse } from "next/server";
import { contractResponse, requireTrustCertificationStageElevenUser } from "../core";

export async function GET() { await requireTrustCertificationStageElevenUser(); return NextResponse.json(contractResponse()); }
