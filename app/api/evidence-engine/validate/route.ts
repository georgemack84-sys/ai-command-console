import { NextResponse } from "next/server";
import { requireEvidenceEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await validateRequest(request)); }
