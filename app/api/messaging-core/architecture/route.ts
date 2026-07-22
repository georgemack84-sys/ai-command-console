import { NextResponse } from "next/server";
import { architectureRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await architectureRequest(request)); }
