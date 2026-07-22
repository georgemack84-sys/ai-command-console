import { NextResponse } from "next/server";
import { contractResponse, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(contractResponse()); }
