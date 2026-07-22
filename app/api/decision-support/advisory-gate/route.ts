import { NextResponse } from "next/server";
import { advisoryGateRequest, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await advisoryGateRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await advisoryGateRequest(request)); }
