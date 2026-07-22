import { NextResponse } from "next/server";
import { contractResponse, requireTrustResolutionEngineUser } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(contractResponse()); }
