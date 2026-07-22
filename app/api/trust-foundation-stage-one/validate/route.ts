import { NextResponse } from "next/server";
import { requireTrustFoundationStageOneUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustFoundationStageOneUser(); return NextResponse.json(await validateRequest(request)); }
