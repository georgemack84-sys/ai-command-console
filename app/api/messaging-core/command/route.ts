import { NextResponse } from "next/server";
import { commandRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await commandRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await commandRequest(request)); }
