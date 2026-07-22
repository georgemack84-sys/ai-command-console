import { NextResponse } from "next/server";
import { evidenceRequest, requireConstitutionalComplianceGateUser } from "../core";

export async function GET() { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await evidenceRequest(request)); }
