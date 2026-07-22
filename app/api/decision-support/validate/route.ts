import { NextResponse } from "next/server";
import { requireDecisionSupportUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await validateRequest(request)); }
