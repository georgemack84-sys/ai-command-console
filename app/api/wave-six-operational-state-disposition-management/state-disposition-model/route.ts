import { NextResponse } from "next/server";
import { requireWaveSixOperationalStateDispositionManagementUser, stateDispositionModelRequest } from "../core";

export async function GET() { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await stateDispositionModelRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await stateDispositionModelRequest(request)); }
