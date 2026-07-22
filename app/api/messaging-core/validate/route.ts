import { NextResponse } from "next/server";
import { requireMessagingCoreUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await validateRequest(request)); }
