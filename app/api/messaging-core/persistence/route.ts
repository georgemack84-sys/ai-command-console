import { NextResponse } from "next/server";
import { persistenceRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await persistenceRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await persistenceRequest(request)); }
