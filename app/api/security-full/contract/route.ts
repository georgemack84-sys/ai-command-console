import { NextResponse } from "next/server";
import { contractResponse, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(contractResponse()); }
