import { NextResponse } from "next/server";
import { failClosedRequest, requireConstitutionalComplianceGateUser } from "../core";

export async function GET() { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await failClosedRequest()); }
export async function POST(request: Request) { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await failClosedRequest(request)); }
