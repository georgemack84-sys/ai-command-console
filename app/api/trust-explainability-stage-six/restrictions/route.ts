import { NextResponse } from "next/server";
import { requireTrustExplainabilityStageSixUser, restrictionsRequest } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await restrictionsRequest()); }
export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await restrictionsRequest(request)); }
