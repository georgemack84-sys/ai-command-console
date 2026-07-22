import { NextResponse } from "next/server";
import { requireMessagingCoreUser, retryRequest } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await retryRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await retryRequest(request)); }
