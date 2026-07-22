import { NextResponse } from "next/server";
import { contractResponse, requireTrustHumanOversightStageSevenUser } from "../core";

export async function GET() { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(contractResponse()); }
