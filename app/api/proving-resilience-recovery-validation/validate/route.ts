import { NextResponse } from "next/server";
import { requireResilienceRecoveryUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireResilienceRecoveryUser(); return NextResponse.json(await validateRequest(request)); }
