import { NextResponse } from "next/server";
import { requireConstitutionalComplianceGateUser, rulesRequest } from "../core";

export async function GET() { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await rulesRequest()); }
export async function POST(request: Request) { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await rulesRequest(request)); }
