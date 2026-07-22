import { NextResponse } from "next/server";
import { evidenceRequest, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await evidenceRequest(request)); }
