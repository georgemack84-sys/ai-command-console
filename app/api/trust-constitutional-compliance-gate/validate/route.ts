import { NextResponse } from "next/server";
import { requireConstitutionalComplianceGateUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireConstitutionalComplianceGateUser(); return NextResponse.json(await validateRequest(request)); }
