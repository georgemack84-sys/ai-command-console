import { NextResponse } from "next/server";
import { replayRequest, requireConstitutionalComplianceGateUser } from "../core";

export async function GET() { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await replayRequest(request)); }
