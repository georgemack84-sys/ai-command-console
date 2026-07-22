import { NextResponse } from "next/server";
import { infrastructureRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await infrastructureRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await infrastructureRequest(request)); }
