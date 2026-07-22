import { NextResponse } from "next/server";
import { requireTrustExplainabilityStageSixUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustExplainabilityStageSixUser(); return NextResponse.json(await validateRequest(request)); }
