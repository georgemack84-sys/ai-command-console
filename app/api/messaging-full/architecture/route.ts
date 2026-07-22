import { NextResponse } from "next/server";
import { architectureRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await architectureRequest(request)); }
