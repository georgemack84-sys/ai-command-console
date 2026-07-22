import { NextResponse } from "next/server";
import { requireDelegationEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await validateRequest(request)); }
