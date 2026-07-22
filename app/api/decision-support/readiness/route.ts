import { NextResponse } from "next/server";
import { readinessRequest, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await readinessRequest(request)); }
