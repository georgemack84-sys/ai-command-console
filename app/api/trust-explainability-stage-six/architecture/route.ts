import { NextResponse } from "next/server";
import { architectureRequest, requireTrustExplainabilityStageSixUser } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await architectureRequest(request)); }
