import { NextResponse } from "next/server";
import { constitutionRequest, requireTrustFoundationStageOneUser } from "../core";

export async function GET() { await requireTrustFoundationStageOneUser(); return NextResponse.json(await constitutionRequest()); }
export async function POST(request: Request) { await requireTrustFoundationStageOneUser(); return NextResponse.json(await constitutionRequest(request)); }
