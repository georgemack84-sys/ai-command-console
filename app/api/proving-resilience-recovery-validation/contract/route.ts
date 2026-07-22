import { NextResponse } from "next/server";
import { contractResponse, requireResilienceRecoveryUser } from "../core";
export async function GET() { await requireResilienceRecoveryUser(); return NextResponse.json(contractResponse()); }
