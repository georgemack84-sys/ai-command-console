import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixOperationalStateDispositionManagementUser } from "../core";

export async function GET() { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(contractResponse()); }
