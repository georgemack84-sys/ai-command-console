import { NextResponse } from "next/server";
import { readinessRequest, requireTrustFoundationStageOneUser } from "../core";

export async function GET() { await requireTrustFoundationStageOneUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustFoundationStageOneUser(); return NextResponse.json(await readinessRequest(request)); }
