import { NextResponse } from "next/server";
import { contractsRequest, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await contractsRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await contractsRequest(request)); }
