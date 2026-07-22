import { NextResponse } from "next/server";
import { administrationRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await administrationRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await administrationRequest(request)); }
