import { NextResponse } from "next/server";
import { contractResponse, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(contractResponse()); }
