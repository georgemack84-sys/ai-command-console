import { NextResponse } from "next/server";
import { requireTrustExplainabilityStageSixUser, ruleTraceRequest } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await ruleTraceRequest()); }
export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await ruleTraceRequest(request)); }
