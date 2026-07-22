import { NextResponse } from "next/server";
import { eventRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await eventRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await eventRequest(request)); }
