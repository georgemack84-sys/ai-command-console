import { NextResponse } from "next/server";
import { readinessRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await readinessRequest(request)); }
