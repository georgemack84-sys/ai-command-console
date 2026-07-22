import { NextResponse } from "next/server";
import { requireTrustFoundationStageOneUser, vocabularyRequest } from "../core";

export async function GET() { await requireTrustFoundationStageOneUser(); return NextResponse.json(await vocabularyRequest()); }
export async function POST(request: Request) { await requireTrustFoundationStageOneUser(); return NextResponse.json(await vocabularyRequest(request)); }
