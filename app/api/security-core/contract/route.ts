import { NextResponse } from "next/server";
import { contractResponse, requireSecurityCoreUser } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(contractResponse()); }
