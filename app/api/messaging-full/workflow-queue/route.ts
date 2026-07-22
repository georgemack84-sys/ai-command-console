import { NextResponse } from "next/server";
import { requireMessagingFullUser, workflowQueueRequest } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await workflowQueueRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await workflowQueueRequest(request)); }
