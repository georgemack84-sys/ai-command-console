import { NextResponse } from "next/server";
import { registryRequest, requireTrustCertificationStageElevenUser } from "../core";

export async function GET() { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireTrustCertificationStageElevenUser(); return NextResponse.json(await registryRequest(request)); }
