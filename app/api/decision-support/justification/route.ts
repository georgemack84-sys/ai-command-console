import { NextResponse } from "next/server";
import { justificationRequest, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await justificationRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await justificationRequest(request)); }
