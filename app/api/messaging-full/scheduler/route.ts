import { NextResponse } from "next/server";
import { requireMessagingFullUser, schedulerRequest } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await schedulerRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await schedulerRequest(request)); }
