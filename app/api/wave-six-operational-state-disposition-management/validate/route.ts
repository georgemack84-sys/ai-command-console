import { NextResponse } from "next/server";
import { requireWaveSixOperationalStateDispositionManagementUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await validateRequest(request)); }
