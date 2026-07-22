import { NextResponse } from "next/server";
import { eventBusRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await eventBusRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await eventBusRequest(request)); }
