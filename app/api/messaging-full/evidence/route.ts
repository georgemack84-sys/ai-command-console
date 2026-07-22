import { NextResponse } from "next/server";
import { evidenceRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await evidenceRequest(request)); }
