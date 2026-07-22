import { NextResponse } from "next/server";
import { readinessRequest, requireTrustExplainabilityStageSixUser } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await readinessRequest(request)); }
