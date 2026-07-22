import { NextResponse } from "next/server";
import { dlqRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await dlqRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await dlqRequest(request)); }
