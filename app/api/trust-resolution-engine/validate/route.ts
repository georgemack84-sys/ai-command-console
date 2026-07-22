import { NextResponse } from "next/server";
import { requireTrustResolutionEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await validateRequest(request)); }
