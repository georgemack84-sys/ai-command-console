import { NextResponse } from "next/server";
import { contractResponse, requireConstitutionalComplianceGateUser } from "../core";

export async function GET() { await requireConstitutionalComplianceGateUser(); return NextResponse.json(contractResponse()); }
