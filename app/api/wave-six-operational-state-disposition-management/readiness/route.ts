import { NextResponse } from "next/server";
import { readinessRequest, requireWaveSixOperationalStateDispositionManagementUser } from "../core";

export async function GET() { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await readinessRequest(request)); }
