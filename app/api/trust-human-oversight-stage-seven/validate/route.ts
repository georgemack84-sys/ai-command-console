import { NextResponse } from "next/server";
import { requireTrustHumanOversightStageSevenUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await validateRequest(request)); }
