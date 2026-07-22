import { NextResponse } from "next/server";
import { engineRequest, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await engineRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await engineRequest(request)); }
