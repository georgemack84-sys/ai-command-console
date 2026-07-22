import { NextResponse } from "next/server";
import { commandBusRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await commandBusRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await commandBusRequest(request)); }
