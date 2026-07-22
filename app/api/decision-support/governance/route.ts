import { NextResponse } from "next/server";
import { governanceRequest, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await governanceRequest(request)); }
