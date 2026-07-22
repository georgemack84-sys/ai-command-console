import { NextResponse } from "next/server";
import { operationsRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await operationsRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await operationsRequest(request)); }
