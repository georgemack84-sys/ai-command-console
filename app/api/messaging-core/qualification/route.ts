import { NextResponse } from "next/server";
import { qualificationRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await qualificationRequest(request)); }
