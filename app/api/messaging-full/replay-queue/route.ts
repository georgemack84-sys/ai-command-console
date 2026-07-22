import { NextResponse } from "next/server";
import { replayQueueRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await replayQueueRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await replayQueueRequest(request)); }
