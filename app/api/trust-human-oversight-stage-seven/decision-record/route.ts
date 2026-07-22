import { NextResponse } from "next/server";
import { decisionRecordRequest, requireTrustHumanOversightStageSevenUser } from "../core";

export async function GET() { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await decisionRecordRequest()); }
export async function POST(request: Request) { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await decisionRecordRequest(request)); }
