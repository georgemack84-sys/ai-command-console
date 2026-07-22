import { NextResponse } from "next/server";
import { contractResponse, requireMessagingFullUser } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(contractResponse()); }
