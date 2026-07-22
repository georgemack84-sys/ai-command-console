import { NextResponse } from "next/server";
import { requireTrustHumanOversightStageSevenUser, workflowRequest } from "../core";

export async function GET() { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await workflowRequest()); }
export async function POST(request: Request) { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await workflowRequest(request)); }
