import { NextResponse } from "next/server";
import { admissibilityRequest, requireConstitutionalComplianceGateUser } from "../core";

export async function GET() { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await admissibilityRequest()); }
export async function POST(request: Request) { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await admissibilityRequest(request)); }
