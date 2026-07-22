import { NextResponse } from "next/server";
import { evidenceMapRequest, requireTrustExplainabilityStageSixUser } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await evidenceMapRequest()); }
export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await evidenceMapRequest(request)); }
