import { NextResponse } from "next/server";
import { lineageRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await lineageRequest(request)); }
