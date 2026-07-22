import { NextResponse } from "next/server";
import { requireConstitutionalComplianceGateUser, violationsRequest } from "../core";

export async function GET() { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await violationsRequest()); }
export async function POST(request: Request) { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await violationsRequest(request)); }
