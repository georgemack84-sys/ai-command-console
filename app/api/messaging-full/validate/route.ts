import { NextResponse } from "next/server";
import { requireMessagingFullUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await validateRequest(request)); }
