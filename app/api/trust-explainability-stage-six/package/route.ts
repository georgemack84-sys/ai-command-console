import { NextResponse } from "next/server";
import { packageRequest, requireTrustExplainabilityStageSixUser } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await packageRequest()); }
export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await packageRequest(request)); }
