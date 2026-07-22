import { NextResponse } from "next/server";
import { contractResponse, requireTrustExplainabilityStageSixUser } from "../core";

export async function GET() { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(contractResponse()); }
