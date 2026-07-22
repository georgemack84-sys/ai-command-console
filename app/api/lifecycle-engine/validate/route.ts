import { NextResponse } from "next/server";
import { requireLifecycleEngineUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await validateRequest(request)); }
