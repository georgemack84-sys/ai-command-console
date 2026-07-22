import { NextResponse } from "next/server";
import { ownershipBoundaryRequest, requireWaveSixOperationalStateDispositionManagementUser } from "../core";

export async function GET() { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await ownershipBoundaryRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await ownershipBoundaryRequest(request)); }
