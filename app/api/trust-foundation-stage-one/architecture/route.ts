import { NextResponse } from "next/server";
import { architectureRequest, requireTrustFoundationStageOneUser } from "../core";

export async function GET() { await requireTrustFoundationStageOneUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireTrustFoundationStageOneUser(); return NextResponse.json(await architectureRequest(request)); }
