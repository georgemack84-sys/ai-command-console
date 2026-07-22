import { NextResponse } from "next/server";
import { contractResponse, requireOperationalIntelligenceUser } from "../core";

export async function GET() { await requireOperationalIntelligenceUser(); return NextResponse.json(contractResponse()); }
