import { NextResponse } from "next/server";
import { contractResponse, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(contractResponse()); }
