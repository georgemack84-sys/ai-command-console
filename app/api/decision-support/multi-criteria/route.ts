import { NextResponse } from "next/server";
import { multiCriteriaRequest, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await multiCriteriaRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await multiCriteriaRequest(request)); }
