import { NextResponse } from "next/server";
import { reliabilityRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await reliabilityRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await reliabilityRequest(request)); }
