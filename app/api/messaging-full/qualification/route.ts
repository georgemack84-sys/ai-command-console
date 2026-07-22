import { NextResponse } from "next/server";
import { qualificationRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await qualificationRequest(request)); }
