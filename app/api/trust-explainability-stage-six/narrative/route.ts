import { NextResponse } from "next/server";
import { narrativeRequest, requireTrustExplainabilityStageSixUser } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await narrativeRequest()); }
export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await narrativeRequest(request)); }
