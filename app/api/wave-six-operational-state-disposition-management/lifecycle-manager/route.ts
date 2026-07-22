import { NextResponse } from "next/server";
import { lifecycleManagerRequest, requireWaveSixOperationalStateDispositionManagementUser } from "../core";

export async function GET() { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await lifecycleManagerRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await lifecycleManagerRequest(request)); }
