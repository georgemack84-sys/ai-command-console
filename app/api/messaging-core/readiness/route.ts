import { NextResponse } from "next/server";
import { readinessRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await readinessRequest(request)); }
