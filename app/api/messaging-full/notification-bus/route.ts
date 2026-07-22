import { NextResponse } from "next/server";
import { notificationBusRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await notificationBusRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await notificationBusRequest(request)); }
